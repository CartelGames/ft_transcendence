from django.urls import path, re_path
from . import views

from django.conf import settings
from django.views.static import serve
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),\
    re_path(r'^static/(?P<path>.*)$', serve),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)