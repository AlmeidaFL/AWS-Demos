# AWS Static Website with S3 + CloudFront + OAC + Signed URL Demo

This project demonstrates how to deploy a secure static website using Amazon S3, CloudFront distribution with Origin Access Control (OAC), and CloudFront signed URLs for controlled access. The setup includes a Lambda function that generates signed URLs for temporary access to protected content.

This architecture is ideal for serving premium content, private documents, or any static resources that require access control and temporary authentication.

---

## Requirements

- AWS CLI installed and configured (aws configure)
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- OpenSSL installed (for key generation)
- Sufficient permissions to create resources (IAM, CloudFront, S3, Lambda, SSM)

---

## Project Structure

```
static-s3-cloudfront-oac-demo/
├── static-site/                # Static website infrastructure
│   ├── template.yaml           # SAM template for S3 + CloudFront + OAC
│   ├── samconfig.toml          # SAM deployment configuration
│   ├── index.html              # Main website page
│   └── error.html              # Error page
├── signed-url-service/         # Lambda service for signed URLs
│   ├── template.yaml           # SAM template for Lambda function
│   ├── samconfig.toml          # SAM deployment configuration
│   ├── app.js                  # Lambda function source code
│   └── package.json            # Node.js dependencies
├── test/                       # Test configuration
│   ├── event.json              # Sample Lambda event for testing
│   └── env.json                # Environment variables for local testing
├── keys/                       # Generated CloudFront keys (created by script)
│   ├── private-key.pem         # Private key for signing URLs
│   └── public-key.pem          # Public key for CloudFront
├── generate-trusted-key.sh     # Script to generate RSA key pair
├── setup-ssm-parameters.sh     # Script to store keys in SSM Parameter Store
├── create-trusted-group.sh     # Script to create CloudFront trusted key group
├── pub-key-config.json         # Configuration for CloudFront public key
└── README.md                   # Project instructions and documentation
```

---

## Step-by-Step Guide 

### 1. Generate CloudFront Keys

```bash
# Generate RSA key pair for CloudFront signed URLs
chmod +x generate-trusted-key.sh
./generate-trusted-key.sh
```

### 2. Create CloudFront Public Key and Trusted Key Group

```bash
# Update pub-key-config.json with your public key
# Get the base64 encoded public key (remove headers and newlines)
cat keys/public-key.pem | grep -v "BEGIN\|END" | tr -d '\n'

# Update pub-key-config.json with the encoded key
# Then create the public key in CloudFront
aws cloudfront create-public-key --public-key-config file://pub-key-config.json > pub-key-return.json

# Extract the public key ID
KEY_ID=$(cat pub-key-return.json | grep -o '"Id":"[^"]*"' | cut -d'"' -f4)

# Create trusted key group
aws cloudfront create-key-group --key-group-config Name=Static-S3-Signed-Demo,Items=$KEY_ID > key-group.json

# Extract the trusted key group ID for deployment
TRUSTED_KEY_GROUP_ID=$(cat key-group.json | grep -o '"Id":"[^"]*"' | cut -d'"' -f4)
echo "Trusted Key Group ID: $TRUSTED_KEY_GROUP_ID"
```

### 3. Deploy Static Website Infrastructure

```bash
# Navigate to static-site directory
cd static-site

# Build and deploy the static website stack
sam build
sam deploy --parameter-overrides TrustedKeyGroupId=$TRUSTED_KEY_GROUP_ID

# Note the CloudFront URL from the output
cd ..
```

### 4. Store Keys in SSM Parameter Store

```bash
# Update setup-ssm-parameters.sh with your key pair ID
# Replace <key pair id> with the actual key pair ID from step 2
sed -i 's/<key pair id>/'$KEY_ID'/g' setup-ssm-parameters.sh

# Store private key and key pair ID in SSM
chmod +x setup-ssm-parameters.sh
./setup-ssm-parameters.sh
```

### 5. Deploy Signed URL Service

```bash
# Navigate to signed-url-service directory
cd signed-url-service

# Install dependencies
npm install

# Build and deploy the Lambda function
sam build
sam deploy

# Get the Lambda function URL from the output
cd ..
```

### 6. Upload Content to S3

```bash
# Get the S3 bucket name from the static-site stack
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name static-s3-cloudfront-oac --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' --output text)

# Upload static files to S3
aws s3 cp static-site/index.html s3://$BUCKET_NAME/
aws s3 cp static-site/error.html s3://$BUCKET_NAME/

# Upload additional test content
echo "<h1>Premium Content</h1><p>This is protected content!</p>" > premium.html
aws s3 cp premium.html s3://$BUCKET_NAME/
```

### 7. Testing the System

```bash
# Get the CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name static-s3-cloudfront-oac --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text)

# Get the Lambda Function URL
LAMBDA_URL=$(aws cloudformation describe-stacks --stack-name signed-url-service --query 'Stacks[0].Outputs[?OutputKey==`SignedUrlFunctionUrl`].OutputValue' --output text)

# Try to access content directly (should fail - 403 Forbidden)
curl -v $CLOUDFRONT_URL/index.html

# Generate a signed URL for index.html
curl "$LAMBDA_URL?path=/index.html"

# Generate a signed URL for premium content
curl "$LAMBDA_URL?path=/premium.html"

# Test the signed URL (copy the signed_url from the previous response)
# curl "SIGNED_URL_HERE"
```

### 8. Local Testing

```bash
# Test the Lambda function locally
cd signed-url-service

# Start the function locally
sam local start-api

# Test with sample event
sam local invoke SignedUrlFunction --event ../test/event.json --env-vars ../test/env.json

cd ..
```

### 9. Monitor and Debug

```bash
# View Lambda logs
sam logs --name SignedUrlFunction --stack-name signed-url-service --tail

# Check CloudFront access logs (if enabled)
aws logs describe-log-groups --log-group-name-prefix "/aws/cloudfront"

# Verify SSM parameters
aws ssm get-parameter --name "/cloudfront/private-key" --with-decryption
aws ssm get-parameter --name "/cloudfront/key-pair-id"
```

### 10. Clean Up Resources

```bash
# Delete the stacks
aws cloudformation delete-stack --stack-name signed-url-service
aws cloudformation delete-stack --stack-name static-s3-cloudfront-oac

# Delete CloudFront resources
aws cloudfront delete-key-group --id $TRUSTED_KEY_GROUP_ID --if-match $(aws cloudfront get-key-group --id $TRUSTED_KEY_GROUP_ID --query 'ETag' --output text)
aws cloudfront delete-public-key --id $KEY_ID --if-match $(aws cloudfront get-public-key --id $KEY_ID --query 'ETag' --output text)

# Delete SSM parameters
aws ssm delete-parameter --name "/cloudfront/private-key"
aws ssm delete-parameter --name "/cloudfront/key-pair-id"

# Clean up local files
rm -rf keys/ pub-key-return.json key-group.json premium.html
```

---

## How It Works

1. **Static Website Setup**: S3 bucket hosts static content with public access blocked
2. **Origin Access Control (OAC)**: CloudFront uses OAC to securely access S3 content
3. **Trusted Key Group**: CloudFront is configured with a trusted key group for signed URL validation
4. **Lambda Function**: Generates time-limited signed URLs using the private key stored in SSM
5. **Secure Access**: Content can only be accessed through valid signed URLs with expiration
6. **Error Handling**: Custom error pages for 403/404 responses

## Key Features

- **Secure Content Delivery**: Content is only accessible through signed URLs
- **Origin Access Control**: Uses modern OAC instead of legacy Origin Access Identity (OAI)
- **Parameter Store Integration**: Private keys securely stored in AWS SSM Parameter Store
- **Time-Limited Access**: Signed URLs expire after 1 minute (configurable)
- **Error Handling**: Custom error pages for better user experience
- **Serverless Architecture**: No infrastructure to manage, pay only for usage

## Security Considerations

- Private keys are stored securely in SSM Parameter Store with encryption
- S3 bucket has all public access blocked
- CloudFront distribution only accepts requests from trusted key groups
- Signed URLs have short expiration times (1 minute by default)
- OAC ensures only CloudFront can access S3 content
- Lambda function has minimal IAM permissions following least privilege principle

## Customization Options

- Modify signed URL expiration time in `app.js` (currently 60 seconds)
- Add custom domains to CloudFront distribution
- Implement different access policies for different content types
- Add authentication/authorization layer before generating signed URLs
- Configure CloudFront caching behaviors for different content paths
- Enable CloudFront access logging for monitoring and analytics

## Troubleshooting

- **403 Errors**: Verify trusted key group configuration and signed URL generation
- **SSM Parameter Issues**: Check IAM permissions for Lambda to access SSM
- **CloudFront Propagation**: Allow time for CloudFront distribution updates to propagate
- **Key Mismatch**: Ensure the public key in CloudFront matches the private key used for signing
- **URL Expiration**: Check if signed URLs have expired (default: 1 minute)
