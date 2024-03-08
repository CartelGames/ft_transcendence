FROM python:3

ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY    requirements.txt    /code/
RUN pip install -r requirements.txt
RUN python -m pip install Pillow
RUN pip install channels
COPY . /code/

CMD [ "bash", "start_djang.sh" ];