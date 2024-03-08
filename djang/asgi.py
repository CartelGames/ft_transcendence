"""
ASGI config for ft_transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import re_path
from . import consumers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ft_transcendence.settings')

django_asgi_app = get_asgi_application()

chat_app = ProtocolTypeRouter({
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi())
            )
        ),
        allowed_hosts=["localhost:8000", "127.0.0.1:8000"],
    ),
})

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": chat_app,
})