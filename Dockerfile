FROM python:3

ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY    requirements.txt    /code/
RUN pip install -r requirements.txt
RUN python manage.py makemigrations
RUN python manage.py migrate
RUN python -m pip install Pillow
COPY . /code/