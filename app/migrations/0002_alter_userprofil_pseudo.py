# Generated by Django 5.0.2 on 2024-03-06 11:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofil',
            name='pseudo',
            field=models.CharField(max_length=32, unique=True),
        ),
    ]
