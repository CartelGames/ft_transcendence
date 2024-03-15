# Generated by Django 5.0.3 on 2024-03-14 13:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Stats',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, unique=True)),
                ('id_player', models.IntegerField()),
                ('pseudo', models.CharField(default='', max_length=32)),
                ('profil_img', models.ImageField(default='base.webp', upload_to='profil/')),
                ('nb_game', models.IntegerField()),
                ('win_rate', models.IntegerField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]