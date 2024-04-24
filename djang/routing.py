from django.urls import re_path

from app import consumer

websocket_urlpatterns = [
    re_path('wss/chat/', consumer.MyConsumer.as_asgi()),
    re_path('wss/game/', consumer.MyGameConsumer.as_asgi()),
    re_path('wss/queue/', consumer.MyQueueConsumer.as_asgi()),
]
