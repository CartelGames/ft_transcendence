from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        self.group_name = f'{self.user.pseudo}'
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
        pass

    @staticmethod
    async def send_message_to_user(id_to):
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