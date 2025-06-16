export MSYS_NO_PATHCONV=1
#!/bin/bash
set -e

mkdir -p certs && cd certs

openssl genrsa -out ca.key 2048

openssl req -x509 -new -noenc -key ca.key -sha256 -days 365 -out ca.pem -subj '/C=BR/ST=SP/L=SaoPaulo/O=LF/CN=lf-ca'

openssl genrsa -out client.key 2048

openssl req -new -key client.key -out client.csr -subj '/C=BR/ST=SP/L=SaoPaulo/O=Client/CN=client.local'

openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out client.pem -days 365 -sha256

cat client.pem ca.pem > client-fullchain.pem