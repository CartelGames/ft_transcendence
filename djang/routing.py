from django.urls import re_path

from app import consumer

websocket_urlpatterns = [
    re_path('ws/chat/', consumer.MyConsumer.as_asgi()),
]
