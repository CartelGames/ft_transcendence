from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from .models import UserProfil, Game, TournamentsGame, Tournaments, MessageTournaments
from asgiref.sync import async_to_sync, sync_to_async
from django.core.exceptions import ObjectDoesNotExist
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
        elif action == 'checkTournament':
            player = await UserProfil.objects.aget(id=self.user.id)
            if player.tournament != 0:
                tour = await Tournaments.objects.aget(id=player.tournament)
                await self.channel_layer.group_send(self.group_name, {'type': 'add_tour_chat', 'name': tour.name})

    @staticmethod
    async def send_message_to_user(id_to):
        channel_layer = get_channel_layer()
        await channel_layer.group_send(f'{id_to}', {'type': 'chat_message', 'message': 'none'})
        pass

    async def chat_message(self, event):
        message = event['message']
        # Envoyer le message au client WebSocket
        await self.send(text_data=json.dumps({'type': 'chat_message', 'message': message}))

    async def add_tour_chat(self, event):
        name = event['name']
        # Envoyer le message au client WebSocket
        await self.send(text_data=json.dumps({'type': 'add_tour_chat', 'name': name}))


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
    games = {}

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
            self.games[int(text_data_json['game_id'])] = []
            self.games[int(text_data_json['game_id'])].append([game.player1, game.player2, 0, 0])
            print(self.user.id, ' - ' ,self.games)
            if game.player1 == self.user.id or game.player2 == self.user.id:
                if game.player1 == text_data_json['player_id']:
                    await self.channel_layer.group_send(self.room_name,
                        {
                            'type': 'game_info',
                            'player_name': game.pseudo_p2,
                            'player_id': game.player2,
                            'play': True
                        })
                else:
                    await self.channel_layer.group_send(self.room_name,
                        {
                            'type': 'game_info',
                            'player_name': game.pseudo_p1,
                            'player_id': game.player1,
                            'play': True
                        })
            else:
                await self.channel_layer.group_send(self.room_name,
                {
                    'type': 'game_info',
                    'player_name': game.pseudo_p1,
                    'player_id': game.player1,
                    'play': False
                })
        elif message == 'game_start':
            game = self.games[int(text_data_json['game_id'])][0]
            if not game or game[2] == 2 or game[0] != self.user.id and game[1] != self.user.id:
                return
            found = False
            db_game = await database_sync_to_async(Game.objects.get)(id=int(text_data_json['game_id']))
            if not db_game or db_game.ended:
                return
            if game and game[2] == 1 and game[3] != self.user.id:
                await self.channel_layer.group_send(self.room_name,
                {
                    'type': 'game_start'
                })
                found = True
                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': 'Game is started good luck !'})
                game[2] = 2
            if not found:
                game[2] = 1
                game[3] = self.user.id
                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': self.user.pseudo + ' is ready, waiting for the oponent..'})
        elif message == 'game_ended':
            game = await database_sync_to_async(Game.objects.get)(id=int(text_data_json['game_id']))
            p1 = await database_sync_to_async(UserProfil.objects.get)(id=game.player1)
            p2 = await database_sync_to_async(UserProfil.objects.get)(id=game.player2)
            if game and p1 and p2 and not game.ended:
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
                try:
                    tournament = await database_sync_to_async(TournamentsGame.objects.get)(game_id=int(text_data_json['game_id']))
                    tour = await database_sync_to_async(Tournaments.objects.get)(id=tournament.tournament_id)
                    if tournament and tour:
                        tournament.state = 3
                        await sync_to_async(tournament.save)()
                        if tournament.phase != 0:
                            update_win = await database_sync_to_async(TournamentsGame.objects.filter)(tournament_id=tournament.tournament_id, phase=(tournament.phase - 1), state=0)
                            if await database_sync_to_async(update_win.exists)():
                                up_win = await database_sync_to_async(update_win.first)()
                                up_game = await database_sync_to_async(Game.objects.get)(id=up_win.game_id)
                                if up_game.player1 is None:
                                    up_game.player1 = game.winner
                                else:
                                    up_game.player2 = game.winner
                                up_game.state = 1
                                await sync_to_async(up_game.save)()
                            next_games = await database_sync_to_async(TournamentsGame.objects.filter)(tournament_id=tournament.tournament_id, phase=tournament.phase, state=1)
                            if await database_sync_to_async(next_games.exists)():
                                next_game = await database_sync_to_async(next_games.first)()
                                next_game.state = 2
                                await sync_to_async(next_game.save)()
                                await sync_to_async(MessageTournaments.objects.create)(id_from='0', id_to=tour.id, pseudo_from='Server', pseudo_to=tour.name,
                                    content='Next match is ' + UserProfil.objects.get(id=next_game.player1).pseudo + ' VS ' + UserProfil.objects.get(id=next_game.player2).pseudo + ' !')

                            else:
                                next_phase = await database_sync_to_async(TournamentsGame.objects.filter)(tournament_id=tournament.tournament_id, phase=(tournament.phase - 1))
                                if await sync_to_async(next_phase.exists)():
                                    async for phase_game in next_phase:
                                        phase_game.state = 1
                                        await sync_to_async(phase_game.save)()
                                    phase_game = await database_sync_to_async(next_phase.first)()
                                    phase_game.state = 2
                                    await sync_to_async(phase_game.save)()
                                    await sync_to_async(MessageTournaments.objects.create)(id_from='0', id_to=tour.id, pseudo_from='Server', pseudo_to=tour.name,
                                    content='Next match is ' + UserProfil.objects.get(id=phase_game.player1).pseudo + ' VS ' + UserProfil.objects.get(id=phase_game.player2).pseudo + ' !')
                        else:
                            if tour:
                                tour.state = 2
                                await sync_to_async(tour.save)()
                            clear_tour = await database_sync_to_async(UserProfil.objects.filter)(tournament=tournament.tournament_id)
                            if await sync_to_async(clear_tour.exists)():
                                async for clear_user in clear_tour:
                                    clear_user.tournament = 0
                                    await sync_to_async(clear_user.save)()
                            if int(text_data_json['score1']) > int(text_data_json['score2']):
                                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': p1.pseudo + ' won the tournament !'})
                                await sync_to_async(MessageTournaments.objects.create)(id_from='0', id_to=tour.id, pseudo_from='Server', pseudo_to=tour.name,
                                        content='And the winner of this tournament is ' + p1.pseudo + ', congratulation !')
                            else:
                                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': p2.pseudo + ' won the tournament !'})
                                await sync_to_async(MessageTournaments.objects.create)(id_from='0', id_to=tour.id, pseudo_from='Server', pseudo_to=tour.name,
                                        content='And the winner of this tournament is ' + p2.pseudo + ', congratulation !')

                        players = await database_sync_to_async(list)(tour.players.all())
                        for player in players:
                            await MyConsumer.send_message_to_user(player.pseudo)
                except ObjectDoesNotExist:
                    pass
            else:
                await self.channel_layer.group_send(self.room_name,{'type': 'msg','message': 'An error occured, the game was not saved !'})

        elif message == 'input':
            game = self.games[int(text_data_json['game_id'])][0]
            if not game or game[0] != self.user.id and game[1] != self.user.id:
                return
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
        play = event['play']
        await self.send(text_data=json.dumps({
            'type': 'game_info',
            'player_name': player_name,
            'player_id': player_id,
            'play': play
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
            player1 = await UserProfil.objects.aget(id=game.player1)
            player2 = await UserProfil.objects.aget(id=game.player2)
            if game.player1 == text_data_json['player_id']:
                await self.channel_layer.group_send(self.room_name,
                    {
                        'type': 'game_info',
                        'player_name': player2.pseudo,
                        'player_id': game.player2
                    })
            else:
                await self.channel_layer.group_send(self.room_name,
                    {
                        'type': 'game_info',
                        'player_name': player1.pseudo,
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