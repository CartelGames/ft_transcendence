from django.contrib import admin
from .models import UserProfil

# Register your models here.
class UserProfilAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'pseudo', 'profil_img', 'is_active', 'mmr')

admin.site.register(UserProfil, UserProfilAdmin)