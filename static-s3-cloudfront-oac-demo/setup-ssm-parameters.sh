#!/bin/bash
set -e

# don't expand into host path on Windows
export MSYS_NO_PATHCONV=1

echo "Sending private key to SSM"
aws ssm put-parameter --name "/cloudfront/private-key" --type SecureString --value "$(cat ./keys/private-key.pem)" --overwrite

echo "Sending Key Pair ID to SSM"
aws ssm put-parameter --name "/cloudfront/key-pair-id" --type String --value <key pair id> --overwrite

echo "Parameters created"