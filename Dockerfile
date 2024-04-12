FROM python:3

ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY    requirements.txt    /code/
RUN pip install -r requirements.txt
COPY . /code/

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "djang.asgi:application"]