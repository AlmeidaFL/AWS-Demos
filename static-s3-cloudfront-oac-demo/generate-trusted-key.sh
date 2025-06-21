export MSYS_NO_PATHCONV=1
#!/bin/bash
set -e

mkdir -p keys && cd keys

openssl genrsa -out private-key.pem 2048
openssl rsa -pubout -in private-key.pem -out public-key.pem

