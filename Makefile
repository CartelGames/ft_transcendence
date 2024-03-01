all : build

build : 
	@sudo hostsed add 0.0.0.0 cartelgames.fr && echo "\033[1;32m~|ADD cartelgames.fr to /etc/hosts|~\033[0m"
	@docker-compose run web django-admin startproject ft_transcendence .
	@docker-compose run web python manage.py makemigrations
	@docker-compose run web python manage.py migrate
	@docker-compose up

down : 
	@sudo hostsed rm 127.0.0.1 alsaez.42.fr && echo "\033[1;31m~|DELETE alsaez.42.fr from /etc/hosts|~\033[0m"
	@docker-compose -f ./docker-compose.yml down

stop : 
	@docker-compose -f ./docker-compose.yml stop

start : 
	@docker-compose -f ./docker-compose.yml start

status : 
	@docker ps

clean : down
	@docker image rm wordpress -f
	@docker image rm mariadb -f
	@docker image rm nginx -f
	@docker volume rm mariadb
	@docker volume rm wordpress && echo "\033[1;33m~| Nettoyage des images/containers/volumes de Docker : OK |~\033[0m"\
	
fclean : clean
	@sudo rm -rf /home/$USER/docker/_data/wordpress/*
	@sudo rm -rf /home/$USER/docker/_data/mariadb/*
	@docker system prune -af && echo "\033[1;33m~| Nettoyage du cache de Docker : OK |~\033[0m"


# minimal color codes
END=$'\x1b[0m
REV=$'\x1b[7m
GREY=$'\x1b[30m
RED=$'\x1b[31m
GREEN=$'\x1b[32m
CYAN=$'\x1b[36m
WHITE=$'\x1b[37m
