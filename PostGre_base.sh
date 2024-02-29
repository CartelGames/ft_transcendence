# Je prépare le fichier à executer dans le docker PostGreSql pour avoir la base, il faudra remplacer les valeurs dans un .env après

-u postgres psql

CREATE DATABASE transcendence;
CREATE USER cartel WITH PASSWORD 'test';
GRANT ALL PRIVILEGES ON DATABASE transcendence TO cartel;
ALTER USER cartel WITH SUPERUSER;

\c transcendence;
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
