from django.urls import path
from . import views

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.UserLogin, name='login'),
    path('signup/', views.UserSignup, name='signup'),
    path('logout/', views.UserLogout, name='logout'),
    path('profilImg/', views.UserProfilImg, name='profilImg'),
    path('newPseudo/', views.newPseudo, name="newPseudo"),
    path('sendChat/', views.UserSendChat, name='sendChat'),
    path('addFriend/', views.UserAddFriend, name='addFriend'),
    path('blockFriend/', views.UserBlockFriend, name='blockFriend'),
    path('createTour/', views.CreateTournament, name='createTour'),
    path('tourRegist/', views.TournamentRegistration, name='tourRegist'),
    path('tourUpdate/', views.TournamentUpdate, name='tourUpdate'),
    path('getProfil/', views.GetProfil, name='getProfil'),
    path('getChat/', views.GetChat, name='getChat'),
    path('getFriends/', views.GetFriends, name='getFriends'),
    path('getBlockedFriends/', views.GetBlockedFriends, name='getBlockedFriends'),
    path('getStats/', views.GetStats, name='getStats'),
    path('loadStats/', views.LoadStats, name='loadStats'),
    path('getTournamentList/', views.GetTournamentList, name='getTournamentList'),
    path('getTournamentInfo/', views.GetTournamentInfo, name='getTournamentInfo'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)