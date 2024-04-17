# Generated by Django 5.0.4 on 2024-04-11 12:55

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_alter_game_winner'),
    ]

    operations = [
        migrations.CreateModel(
            name='TournamentsGame',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, unique=True)),
                ('tournament_id', models.IntegerField()),
                ('game_id', models.IntegerField(default=0, null=True)),
                ('phase', models.IntegerField(default=0, null=True)),
                ('state', models.IntegerField(default=0, null=True)),
            ],
        ),
        migrations.AddField(
            model_name='game',
            name='tournament',
            field=models.IntegerField(default=0, null=True),
        ),
        migrations.AddField(
            model_name='userprofil',
            name='tournament',
            field=models.IntegerField(default=0, null=True),
        ),
        migrations.AlterField(
            model_name='game',
            name='player1',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='game',
            name='winner',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.CreateModel(
            name='Tournaments',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(max_length=32, unique=True)),
                ('creator', models.IntegerField()),
                ('winner', models.IntegerField(blank=True, default=0, null=True)),
                ('state', models.IntegerField(default=0, null=True)),
                ('ended', models.BooleanField(default=False)),
                ('players', models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
