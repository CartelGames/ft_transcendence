from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

class UserProfil(AbstractUser):
    # id = models.AutoField(primary_key=True, unique=True)
    email = models.EmailField(unique=True)
    pseudo = models.CharField(max_length=32, unique=True)
    profil_img = models.ImageField(upload_to='profil/', default="base.webp")
    is_active = models.BooleanField(default=True)
    mmr = models.IntegerField(null=True, default=0)
    
    groups = models.ManyToManyField('auth.Group', related_name='user_profiles')
    user_permissions = models.ManyToManyField('auth.Permission', related_name='user_profiles_permissions')
