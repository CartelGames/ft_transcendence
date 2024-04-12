from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from .models import UserProfil, Game
from asgiref.sync import async_to_sync, sync_to_async
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

class MyQueueTwoConsumer(AsyncWebsocketConsumer):
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
            self.room_name = str(text_data_json['game_id'])
            await self.channel_layer.group_add(self.room_name, self.channel_name)
            game = await database_sync_to_async(Game.objects.get)(id=int(text_data_json['game_id']))
            if game.ended:
                winner = await database_sync_to_async(Game.objects.get)(id=game.winner)
                if winner:
                    await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': winner.pseudo + ' is ready, waiting for the oponent..'})
                    return
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
                    found = True
                    await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': 'Game is started good luck !'})
                    break
                elif game[0] == text_data_json['game_id']:
                    found = True
            if not found:
                self.games.append((text_data_json['game_id'], self.user.pseudo))
                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': self.user.pseudo + ' is ready, waiting for the oponent..'})
        
        elif message == 'game_ended':
            print('test ', int(text_data_json['game_id']))
            game = await database_sync_to_async(Game.objects.get)(id=int(text_data_json['game_id']))
            p1 = await database_sync_to_async(UserProfil.objects.get)(id=game.player1)
            p2 = await database_sync_to_async(UserProfil.objects.get)(id=game.player2)
            if game and p1 and p2 and not game.ended:
                print('in')
                game.score1 = int(text_data_json['score1'])
                game.score2 = int(text_data_json['score2'])
                game.ended = True
                if int(text_data_json['score1']) > int(text_data_json['score2']):
                    game.winner = game.player1
                    await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': p1.pseudo + ' won the game !'})
                else:
                    game.winner = game.player2
                    await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': p2.pseudo + ' won the game !'})
                await sync_to_async(game.save)()
            else:
                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': 'An error occured, the game was not saved !'})

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

class MyGameTwoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "game_room"
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
            print(message)
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
        elif message == 'input':
            input_value = text_data_json['input']
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'game_state',
                    'input_value': input_value,
                }
            )

    async def game_state(self, event):
        input_value = event['input_value']
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'input_value': input_value,
        }))

    async def game_info(self, event):
        player_name = event['player_name']
        player_id = event['player_id']
        await self.send(text_data=json.dumps({
            'type': 'game_info',
            'player_name': player_name,
            'player_id': player_id,
        }))