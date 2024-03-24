from channels.generic.websocket import AsyncWebsocketConsumer

class MyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print('test')
        await self.accept()

    async def disconnect(self, close_code):
        print('test2')
        pass

    async def receive(self, text_data):
        print('test3')
        pass
