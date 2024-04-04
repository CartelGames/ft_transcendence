from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json, asyncio

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        self.group_name = f'{self.user.pseudo}'
        print(self.group_name)
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
            )
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data["action"]

        if action == 'sendChat':
            await self.send_message_to_user(data["pseudo"])

        print('test3')
        pass

    @staticmethod
    async def send_message_to_user(id_to):
        print('test')
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'{id_to}',
            {
                'type': 'chat_message',
                'message': 'none'
            }
        )
        pass

    async def chat_message(self, event):
        message = event['message']
        # Envoyer le message au client WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

waiting_id = "none"
waiting_pseudo = "none"

class MyGameConsumer(AsyncWebsocketConsumer):
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
        global waiting_id
        global waiting_pseudo
        text_data_json = json.loads(text_data)
        message = text_data_json['type']
        print(message)
        if message == 'connect':
            if waiting_id == "none":
                print("moi")
                waiting_pseudo = text_data_json['player_name']
                waiting_id = text_data_json['player_id']
            else:
                print("adversaire")
                print(waiting_pseudo)
                await self.send(text_data=json.dumps({
                    'type':'connect',
                    'player_name': waiting_pseudo,
                    'player_id': waiting_id,
                }))
                waiting_pseudo = "none"
                waiting_id = "none"
                print(waiting_pseudo)
        if message == 'disconnect':
            id = text_data_json['player_id']
            if waiting_id == id:
                waiting_id = "none"
                waiting_pseudo = "none"
        if message == 'input':
            player_name = text_data_json['player_name']
            player_id = text_data_json['player_id']
            input_value = text_data_json['input_value']       
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'game_state',
                    'player_name': player_name,
                    'player_id': player_id,
                    'input_value': input_value,
                    'message': message
                }
            )

    async def game_state(self, event):
        player_name = event['player_name']
        player_id = event['player_id']
        input_value = event['input_value']
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'player_name': player_name,
            'player_id': player_id,
            'input_value': input_value,
            'message': message
        }))