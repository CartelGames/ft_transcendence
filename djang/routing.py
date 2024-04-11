from django.urls import re_path

from app import consumer

websocket_urlpatterns = [
    re_path('ws/chat/', consumer.MyConsumer.as_asgi()),
    re_path('ws/game/', consumer.MyGameConsumer.as_asgi()),
    re_path('ws/gametwo/', consumer.MyGameTwoConsumer.as_asgi()),
    re_path('ws/queue/', consumer.MyQueueConsumer.as_asgi()),
    re_path('ws/queuetwo/', consumer.MyQueueTwoConsumer.as_asgi()),
]
