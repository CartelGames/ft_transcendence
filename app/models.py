from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

class UserProfil(AbstractUser):
    email = models.EmailField(unique=True)
    pseudo = models.CharField(max_length=32, unique=True)
    profil_img = models.ImageField(upload_to='profil/', default="base.webp")
    is_active = models.BooleanField(default=True)
    nb_games = models.IntegerField(null=True, default=0)
    mmr = models.IntegerField(null=True, default=0)
    tournament = models.IntegerField(null=True, default=0)
    friends = models.ManyToManyField('self', blank=True)
    blocked_friends = models.ManyToManyField('self', blank=True)
    
    groups = models.ManyToManyField('auth.Group', related_name='user_profiles')
    user_permissions = models.ManyToManyField('auth.Permission', related_name='user_profiles_permissions')

    def add_friend(self, friend):
        if friend not in self.friends.all():
            self.friends.add(friend)
            friend.friends.add(self)
            self.save()
            friend.save()

    def remove_friend(self, friend):
        if friend in self.friends.all():
            self.friends.remove(friend)
            friend.friends.remove(self)
            self.save()
            friend.save()

    def switch_blocked_friend(self, friend, block):
        if block:
            if friend in self.friends.all():
                self.friends.remove(friend)
                friend.friends.remove(self)
                self.blocked_friends.add(friend)
                friend.blocked_friends.add(self)
                self.save()
                friend.save()
        else:
            if friend in self.blocked_friends.all():
                self.blocked_friends.remove(friend)
                friend.blocked_friends.remove(self)
                self.friends.add(friend)
                friend.friends.add(self)
                self.save()
                friend.save()

class Message(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    id_from = models.IntegerField(null=False)
    id_to = models.IntegerField(null=False)
    pseudo_from = models.CharField(max_length=32, default="")
    pseudo_to = models.CharField(max_length=32, default="")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class MessageTournaments(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    id_from = models.IntegerField(null=False)
    id_to = models.IntegerField(null=False)
    pseudo_from = models.CharField(max_length=32, default="")
    pseudo_to = models.CharField(max_length=32, default="")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class Game(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    player1 = models.IntegerField(blank=True, null=True)
    player2 = models.IntegerField(blank=True, null=True)
    player3 = models.IntegerField(blank=True, null=True)
    player4 = models.IntegerField(blank=True, null=True)
    game_type = models.IntegerField(blank=True, null=True, default=0)
    score1 = models.IntegerField(blank=True, null=True, default=0)
    score2 = models.IntegerField(blank=True, null=True, default=0)
    pseudo_p1 = models.CharField(max_length=32, default="")
    pseudo_p2 = models.CharField(max_length=32, default="")
    winner = models.IntegerField(blank=True, null=True, default=0)
    tournament = models.IntegerField(null=True, default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    ended = models.BooleanField(default=False)

    def set_players(self, p1, p2, state):
        self.player1 = p1
        self.player2 = p2
        self.state = state
        self.save()

class TournamentsGame(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    tournament_id = models.IntegerField(null=False)
    game_id = models.IntegerField(null=True, default=0)
    phase = models.IntegerField(null=True, default=0)
    state = models.IntegerField(null=True, default=0)

    def set_match(self, id):
        self.game_id = id
        self.save()
    
    def set_state(self, state):
        self.state = state
        self.save()

class Tournaments(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    name = models.CharField(max_length=32, unique=True)
    creator = models.IntegerField(null=False)
    players = models.ManyToManyField('UserProfil', blank=True)
    winner = models.IntegerField(blank=True, null=True, default=0)
    state = models.IntegerField(null=True, default=0)
    ended = models.BooleanField(default=False)

    def add_player(self, player):
        if player not in self.players.all():
            self.players.add(player)
            player.tournament = self.id
            self.save()
            player.save()

    def remove_player(self, player):
        if player in self.players.all():
            self.players.remove(player)
            player.tournament = 0
            self.save()
            player.save()

    def update_state(self, state):
        self.state = state
        self.save()

    def clear_players(self):
        for player in self.players.all():
            player.tournament = 0
            player.save()
