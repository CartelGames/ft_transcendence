FROM nginx:alpine

COPY default.conf nginx.conf/etc/nginx/conf.d/default.conf
COPY your_ssl_certificate.crt /etc/ssl/certs/your_ssl_certificate.crt
COPY your_ssl_certificate_key.key /etc/ssl/private/your_ssl_certificate_key.key

EXPOSE 80 443