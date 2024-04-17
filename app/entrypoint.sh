#!/bin/sh

python -m pip install Pillow
pip install djangorestframework

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi


#python manage.py flush --no-input

python manage.py makemigrations djang
python manage.py migrate

# python manage.py collectstatic --no-input

echo "from django.contrib.auth.models import User; User.objects.filter(email='admin@example.com').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | python manage.py shell

exec "$@"