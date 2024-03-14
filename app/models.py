from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

class UserProfil(AbstractUser):
    email = models.EmailField(unique=True)
    pseudo = models.CharField(max_length=32, unique=True)
    profil_img = models.ImageField(upload_to='profil/', default="base.webp")
    is_active = models.BooleanField(default=True)
    mmr = models.IntegerField(null=True, default=0)
    friends = models.ManyToManyField('self', blank=True)
    
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

class Message(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    id_from = models.IntegerField(null=False)
    id_to = models.IntegerField(null=False)
    pseudo_from = models.CharField(max_length=32, default="")
    pseudo_to = models.CharField(max_length=32, default="")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)