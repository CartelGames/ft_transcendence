from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from .models import UserProfil, Game
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
import json, asyncio

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            return await self.close()
        self.group_name = f'{self.user.pseudo}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add("lobby", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data["action"]

        if action == 'sendChat':
            await self.send_message_to_user(data["pseudo"])
        pass

    @staticmethod
    async def send_message_to_user(id_to):
        channel_layer = get_channel_layer()
        await channel_layer.group_send(f'{id_to}', {'type': 'chat_message', 'message': 'none'})
        pass

    async def chat_message(self, event):
        message = event['message']
        # Envoyer le message au client WebSocket
        await self.send(text_data=json.dumps({'type': 'chat_message', 'message': message}))


class MyQueueConsumer(AsyncWebsocketConsumer):
    queue = []
    match_found = False
    async def connect(self):
        self.user = self.scope["user"]
        self.group_name = None
        await self.accept()

    async def disconnect(self, close_code):
        if any(self.channel_name == queue_item[0] for queue_item in self.queue):
            print(self.user.pseudo + " - LEAVE THE QUEUE")
            for queue_item in self.queue:
                if queue_item[0] == self.channel_name:
                    self.queue.remove(queue_item)
                    break 
            self.match_found = False

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data["action"]

        if action == 'join_queue':
            if not self.match_found:
                self.user = self.scope["user"]
                user_mmr = self.user.mmr
                print(self.user.pseudo + " - " + str(user_mmr) + " MMR")
                self.queue.append((self.channel_name, user_mmr, self.user.pseudo))
                await self.send(text_data=json.dumps({'type': 'msg', 'message': 'You have joined the matchmaking queue !'}))
                print(self.queue)
                if len(self.queue) >= 2:
                    await self.create_game()
        elif action == 'leave_queue':
            if any(self.channel_name == queue_item[0] for queue_item in self.queue):
                print(self.user.pseudo + " - LEAVE THE QUEUE")
                for queue_item in self.queue:
                    if queue_item[0] == self.channel_name:
                        self.queue.remove(queue_item)
                        break 
                self.match_found = False

    async def create_game(self):
        for i in range(0, len(self.queue), 2):
            p1_channel, p1_mmr, p1_pseudo = self.queue[i]
            p2_channel, p2_mmr, p2_pseudo = self.queue[i + 1]
            player1M = await UserProfil.objects.aget(pseudo=p1_pseudo)
            player2M = await UserProfil.objects.aget(pseudo=p2_pseudo)

            game = await database_sync_to_async(Game.objects.create)(player1=player1M.id, player2=player2M.id, pseudo_p1=player1M.pseudo, pseudo_p2=player2M.pseudo,)
            game_id = game.id
            group_name = f"{p1_pseudo}-{p2_pseudo}"
            self.group_name = group_name
            await self.channel_layer.group_add(group_name, p1_channel)
            await self.channel_layer.group_add(group_name, p2_channel)
            for queue_item in self.queue:
                    if queue_item[0] == p1_channel or queue_item[0] == p2_channel:
                        self.queue.remove(queue_item)
            await self.channel_layer.group_send(group_name, {
                    'type': 'game_start',
                    'game_id': str(game_id),
                    'p1_pseudo': p1_pseudo,
                    'p2_pseudo': p2_pseudo,
                    'message': 'Opponent found. Game starting...'
                }
            )

    async def game_start(self, event):
        game_id = event['game_id']
        p1_pseudo = event['p1_pseudo']
        p2_pseudo = event['p2_pseudo']
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            'game_id': game_id,
            'p1_pseudo': p1_pseudo,
            'p2_pseudo': p2_pseudo,
            'message': message

        }))

class MyGameConsumer(AsyncWebsocketConsumer):
    games = []

    async def connect(self):
        self.room_name = "game_room"
        self.user = self.scope["user"]
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if 'type' in text_data_json:
            message = text_data_json['type']
        else:
            return

        if message == 'game_info':
            await self.channel_layer.group_discard(self.room_name, self.channel_name)
            self.room_name = text_data_json['game_id']
            await self.channel_layer.group_add(self.room_name, self.channel_name)
            game = await database_sync_to_async(Game.objects.get)(id=int(text_data_json['game_id']))
            if game.player1 == text_data_json['player_id']:
                await self.channel_layer.group_send(self.room_name,
                    {
                        'type': 'game_info',
                        'player_name': game.pseudo_p2,
                        'player_id': game.player2
                    })
            else:
                await self.channel_layer.group_send(self.room_name,
                    {
                        'type': 'game_info',
                        'player_name': game.pseudo_p1,
                        'player_id': game.player1
                    })
        elif message == 'game_start':
            found = False
            for game in self.games:
                if game[0] == text_data_json['game_id'] and game[1] != self.user.pseudo:
                    await self.channel_layer.group_send(self.room_name,
                    {
                        'type': 'game_start'
                    })
                    print('found for ', text_data_json['game_id'], ' by ', self.user.pseudo)
                    found = True
                    break
            if not found:
                self.games.append((text_data_json['game_id'], self.user.pseudo))
                print(self.games)
                await self.channel_layer.group_send(self.room_name,
                {
                    'type': 'msg',
                    'message': self.user.pseudo + ' is ready, waiting for the oponent..'
                })

           
        elif message == 'input':
            player_pos = text_data_json['player_pos']
            input_value = text_data_json['input_value']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'game_state',
                    'player_pos': player_pos,
                    'input_value': input_value,
                }
            )
        elif message == 'ball':
            ball_posx = text_data_json['ball_posx']
            ball_posy = text_data_json['ball_posy']
            ball_dirx = text_data_json['ball_dirx']
            ball_diry = text_data_json['ball_diry']
            ball_speed = text_data_json['ball_speed']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'ball',
                    'ball_posx': ball_posx,
                    'ball_posy': ball_posy,
                    'ball_dirx': ball_dirx,
                    'ball_diry': ball_diry,
                    'ball_speed': ball_speed,
                }
            )
        elif message == 'powerupgenerate':
            poweruptype = text_data_json['poweruptype']
            poweruppos = text_data_json['poweruppos']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'powerupgenerate',
                    'poweruptype': poweruptype,
                    'poweruppos': poweruppos,
                }
            )
        elif message == 'powerupactivate':
            poweruptype = text_data_json['poweruptype']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'powerupactivate',
                    'poweruptype': poweruptype,
                }
            )
        elif message == 'pause':
            player = text_data_json['player']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'pause',
                    'player': player,
                }
            )
        
    async def game_state(self, event):
        player_pos = event['player_pos']
        input_value = event['input_value']
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'player_pos': player_pos,
            'input_value': input_value,
        }))

    async def msg(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'msg',
            'message': message
        }))

    async def game_info(self, event):
        player_name = event['player_name']
        player_id = event['player_id']
        await self.send(text_data=json.dumps({
            'type': 'game_info',
            'player_name': player_name,
            'player_id': player_id,
        }))

    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start',
        }))

    async def ball(self, event):
        ball_posx = event['ball_posx']
        ball_posy = event['ball_posy']
        ball_dirx = event['ball_dirx']
        ball_diry = event['ball_diry']
        ball_speed = event['ball_speed']
        await self.send(text_data=json.dumps({
            'type': 'ball',
            'ball_posx': ball_posx,
            'ball_posy': ball_posy,
            'ball_dirx': ball_dirx,
            'ball_diry': ball_diry,
            'ball_speed': ball_speed,
        }))

    async def powerupgenerate(self, event):
        poweruptype = event['poweruptype']
        poweruppos = event['poweruppos']
        await self.send(text_data=json.dumps({
            'type': 'powerupgenerate',
            'poweruptype': poweruptype,
            'poweruppos': poweruppos,
        }))
    
    async def pause(self, event):
        player = event['player']
        await self.send(text_data=json.dumps({
            'type': 'pause',
            'player': player,
        }))