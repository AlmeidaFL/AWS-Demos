#!/bin/bash

BUCKET_NAME="mtls-demo-certs"

aws s3 mb s3://$BUCKET_NAME --region sa-east-1 || true

aws s3 cp certs/ca.pem s3://mtls-demo-certs/ca.pem

aws s3api put-public-access-block --bucket mtls-demo-certs --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

aws s3api put-bucket-policy --bucket mtls-demo-certs --policy file://bucket-policy.json

echo "Certificado da CA enviado para: s3://$BUCKET_NAME/ca.pem"