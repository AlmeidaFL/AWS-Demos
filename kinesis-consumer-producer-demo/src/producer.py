import boto3
import json
import os

kinesis = boto3.client('kinesis')

def handler(event, context):
    data = {
        "product": "freezer",
        "quantity": 2
    }

    response = kinesis.put_record(
        StreamName=os.environ["STREAM_NAME"],
        Data=json.dumps(data),
        PartitionKey="demo"
    )

    print("PutRecord response: ", response)
    return { "status": "ok" }