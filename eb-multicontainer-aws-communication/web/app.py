from fastapi import FastAPI, UploadFile, HTTPException
import boto3, os, uuid, json

app = FastAPI()
s3 = boto3.client("s3")
sqs = boto3.client("sqs")
dynamo = boto3.resource("dynamodb")

BUCKET = os.environ["BUCKET"]
QUEUE_URL = os.environ["QUEUE_URL"]
TABLE_NAME = os.environ["TABLE_NAME"]
table = dynamo.Table(TABLE_NAME)

@app.post("/upload")
async def upload_image(file: UploadFile):
    fileKey = f"raw/{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    s3.upload_fileobj(file.file, BUCKET, fileKey)
    newItem = {"id": fileKey, "status": "NEW"}
    table.put_item(Item=newItem)
    sqs.send_message(QueueUrl=QUEUE_URL, MessageBody=json.dumps({"key": fileKey}))
    
    return {"message": "queued", "id": fileKey}

@app.post("/update-image-status")
async def update_image_status(id: str, status: str):
    table.update_item(
        Key={"id": id},
        UpdateExpression="SET #s = :val",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":val": status},
    )
    return {"message": "ok"}