# AWS API Gateway with mTLS (Mutual TLS) Authentication Demo

This project demonstrates how to deploy an AWS API Gateway with mutual TLS (mTLS) authentication using client certificates. The setup includes certificate generation, S3 truststore configuration, and a custom domain with regional certificate validation.

mTLS provides enhanced security by requiring both the client and server to authenticate each other using certificates, making it ideal for B2B APIs and high-security environments.

---

## Requirements

- AWS CLI installed and configured (aws configure)
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- OpenSSL installed (for certificate generation)
- A registered domain name that you control
- ACM Certificate for your domain (must be in us-east-1 for regional endpoints)
- Sufficient permissions to create resources (IAM, API Gateway, Lambda, S3)

---

## Project Structure

```
api-gateway-certificate-user/
├── lambda/                     # Lambda function source code
│   └── app.js
├── certs/                      # Generated certificates (created by script)
│   ├── ca.key                  # Certificate Authority private key
│   ├── ca.pem                  # Certificate Authority certificate
│   ├── client.key              # Client private key
│   ├── client.pem              # Client certificate
│   ├── client.csr              # Client certificate signing request
│   └── client-fullchain.pem    # Client certificate with CA chain
├── template.yaml               # SAM template
├── generate-certs.sh           # Script to generate CA and client certificates
├── put-certs-on-s3.sh         # Script to upload CA certificate to S3
├── bucket-policy.json          # S3 bucket policy for API Gateway access
└── README.md                   # Project instructions and documentation
```

---

## Step-by-Step Guide

### 1. Prerequisites Setup

```bash
# Ensure you have a domain and ACM certificate
# The certificate must be in us-east-1 region for API Gateway regional endpoints
# Note down your ACM Certificate ID (not the full ARN, just the ID part)
```

### 2. Generate Certificates

```bash
# Generate CA and client certificates
chmod +x generate-certs.sh
./generate-certs.sh
```

### 3. Upload CA Certificate to S3

```bash
# Create S3 bucket and upload CA certificate
chmod +x put-certs-on-s3.sh
./put-certs-on-s3.sh
```

### 4. Deploy the Stack

```bash
# Build the SAM application
sam build

# Deploy stack (replace YOUR_CERTIFICATE_ID with your actual ACM certificate ID)
sam deploy \
    --stack-name api-gateway-mtls-demo \
    --parameter-overrides CertificateId=YOUR_CERTIFICATE_ID \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-east-1

# Alternative: Deploy with guided prompts (first time)
sam deploy --guided
```

### 5. Configure DNS

```bash
# Get the regional domain name from the stack output
sam list stack-outputs --stack-name api-gateway-mtls-demo --region us-east-1

# Or use AWS CLI
aws cloudformation describe-stacks \
    --stack-name api-gateway-mtls-demo \
    --query 'Stacks[0].Outputs' \
    --region us-east-1

# Create a CNAME record in your DNS provider:
# mtls.almeidafl.dev -> d-xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

### 6. Testing the mTLS API

```bash
# Test without client certificate (should fail)
curl -v https://mtls.almeidafl.dev/hello

# Test with client certificate (should succeed)
curl -v \
    --cert certs/client-fullchain.pem \
    --key certs/client.key \
    https://mtls.almeidafl.dev/hello

# Alternative test with separate cert and CA
curl -v \
    --cert certs/client.pem \
    --key certs/client.key \
    --cacert certs/ca.pem \
    https://mtls.almeidafl.dev/hello
```

### 7. Verify Logs

```bash
# View Lambda logs using SAM CLI
sam logs --name DemoFunction --stack-name api-gateway-mtls-demo --tail

# Or check Lambda logs with AWS CLI
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/DemoFunction"
aws logs tail /aws/lambda/DemoFunction --follow
```

### 8. Local Development (Optional)

```bash
# Start API locally for testing
sam local start-api

# Test locally (without mTLS - for function testing only)
curl http://localhost:3000/hello
```

### 9. Clean Up Resources

```bash
# Delete the SAM stack
sam delete --stack-name api-gateway-mtls-demo --region us-east-1

# Remove S3 bucket and contents
aws s3 rm s3://mtls-demo-certs --recursive
aws s3 rb s3://mtls-demo-certs --region sa-east-1

# Clean up local certificates (optional)
rm -rf certs/
```

---

## How It Works

1. **Certificate Generation**: The `generate-certs.sh` script creates a Certificate Authority (CA) and client certificates
2. **Truststore Setup**: The CA certificate is uploaded to S3 to serve as the truststore for API Gateway
3. **API Gateway Configuration**: The custom domain is configured with mTLS authentication pointing to the S3 truststore
4. **Client Authentication**: Clients must present a valid certificate signed by the CA to access the API
5. **Request Processing**: Valid requests are forwarded to the Lambda function

## Important Notes

- The ACM certificate must be in the **us-east-1** region for API Gateway regional endpoints
- The S3 bucket policy allows API Gateway to access the CA certificate
- Client certificates must be signed by the CA certificate stored in the truststore
- The `DisableExecuteApiEndpoint: true` setting ensures only the custom domain can be used
- DNS propagation may take some time after creating the CNAME record
- Use `sam deploy --guided` for first-time deployment to save configuration in `samconfig.toml`

## Security Considerations

- Store private keys securely and never commit them to version control
- Implement certificate rotation procedures for production environments
- Monitor certificate expiration dates
- Consider using AWS Certificate Manager Private CA for production workloads
- Implement proper logging and monitoring for certificate-based authentication events
