# Generated by Django 5.0.3 on 2024-03-14 17:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_delete_stats'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofil',
            name='nb_games',
            field=models.IntegerField(default=0, null=True),
        ),
    ]