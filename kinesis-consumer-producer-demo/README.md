# AWS Lambda Producer → Kinesis → Lambda Consumer Demo

This project demonstrates how to build a real-time data streaming pipeline using AWS Lambda as both producer and consumer with Amazon Kinesis Data Streams. The setup includes a Lambda function that produces data to a Kinesis stream, which is then consumed by another Lambda function for processing.

---

## Requirements

- AWS CLI installed and configured (aws configure)
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- Python 3.13 runtime
- Sufficient permissions to create resources (IAM, Lambda, Kinesis)

---

## Project Structure

```
kinesis-consumer-producer-demo/
├── src/                        # Lambda functions source code
│   ├── producer.py             # Lambda producer function
│   └── consumer.py             # Lambda consumer function
├── events/                     # Test events for local testing
│   └── invoke-producer.json    # Sample event for producer testing
├── template.yaml               # SAM template for infrastructure
├── samconfig.toml              # SAM deployment configuration
├── output.json                 # Sample output from producer
└── README.md                   # Project instructions and documentation
```

---

## Step-by-Step Guide

### 1. Deploy the Infrastructure

```bash
# Build the SAM application
sam build

# Deploy the stack
sam deploy

# Alternative: Deploy with guided prompts (first time)
sam deploy --guided
```

### 2. Test the Producer Function

```bash
# Invoke the producer function to send data to Kinesis
sam local invoke LambdaProducer --event events/invoke-producer.json

# Or invoke the deployed function
aws lambda invoke \
    --function-name LambdaProducer \
    --payload '{}' \
    output.json

# Check the output
cat output.json
```

### 3. Monitor Consumer Function Logs

```bash
# View consumer logs to see processed messages
sam logs --name LambdaConsumer --tail

# Or use AWS CLI to monitor logs
aws logs tail /aws/lambda/LambdaConsumer --follow
```

### 4. Send Multiple Messages for Testing

```bash
# Create a simple test script to send multiple messages
for i in {1..5}; do
    aws lambda invoke \
        --function-name LambdaProducer \
        --payload '{}' \
        output-$i.json
    echo "Sent message $i"
    sleep 1
done
```

### 5. Monitor Kinesis Stream

```bash
# Get stream details
aws kinesis describe-stream --stream-name $(aws cloudformation describe-stacks --stack-name kinesis-consumer-producer --query 'Stacks[0].Outputs[?OutputKey==`KinesisStreamName`].OutputValue' --output text)

# Get shard iterator for reading records
STREAM_NAME=$(aws cloudformation describe-stacks --stack-name kinesis-consumer-producer --query 'Stacks[0].Outputs[?OutputKey==`KinesisStreamName`].OutputValue' --output text)

SHARD_ITERATOR=$(aws kinesis get-shard-iterator \
    --stream-name $STREAM_NAME \
    --shard-id shardId-000000000000 \
    --shard-iterator-type TRIM_HORIZON \
    --query 'ShardIterator' \
    --output text)

# Read records from the stream
aws kinesis get-records --shard-iterator $SHARD_ITERATOR
```

### 6. Local Development and Testing

```bash
# Start the producer function locally
sam local start-lambda

# In another terminal, invoke the local function
aws lambda invoke \
    --function-name LambdaProducer \
    --endpoint-url http://127.0.0.1:3001 \
    --payload '{}' \
    local-output.json

# Generate Kinesis event for local consumer testing
sam local generate-event kinesis > events/kinesis-event.json

# Test consumer locally with generated event
sam local invoke LambdaConsumer --event events/kinesis-event.json
```

### 7. Clean Up Resources

```bash
# Delete the SAM stack
sam delete --stack-name kinesis-consumer-producer

# Verify all resources are deleted
aws cloudformation describe-stacks --stack-name kinesis-consumer-producer
```

---

## How It Works

1. **Producer Function**: Generates sample data (product orders) and sends records to Kinesis Data Stream
2. **Kinesis Stream**: Stores streaming data with configurable retention (24 hours) and partitioning
3. **Consumer Function**: Automatically triggered by Kinesis events, processes records in batches
4. **Event Processing**: Consumer decodes base64-encoded data and processes JSON payloads
5. **Batch Processing**: Consumer handles up to 10 records per batch with LATEST starting position
6. **Error Handling**: Failed records can be retried based on Kinesis configuration


## Configuration Options

- **Batch Size**: Adjust the number of records processed per Lambda invocation (1-100)
- **Starting Position**: Configure where to start reading (LATEST, TRIM_HORIZON, AT_TIMESTAMP)
- **Shard Count**: Scale Kinesis throughput by increasing shard count
- **Retention Period**: Configure data retention from 1 hour to 365 days
- **Lambda Timeout**: Adjust function timeout based on processing requirements
- **Error Handling**: Configure retry attempts and dead letter queues

# APIs mais cobradas
- PutRecord / PutRecords – Send events.
- Event Source Mapping – conect Lambda to Kinesis.
- CloudWatch Logs – Watch execution logs (e.g "print").