import boto3, os, json, time, logging, uuid, requests

logging.basicConfig(level=logging.INFO)

s3 = boto3.client("s3")
sqs = boto3.client("sqs")

BUCKET = os.environ["BUCKET"]
QUEUE_URL = os.environ["QUEUE_URL"]

def create_fake_thumbnail(key: str):
    tmp_file  = f"/tmp/{uuid.uuid4()}-{os.path.basename(key)}"
    s3.download_file(BUCKET, key, tmp_file)
    new_key = key.replace("raw/", "processed/")
    s3.upload_file(tmp_file, BUCKET, new_key)
    logging.info("Processed %s => %s", key, new_key)
    requests.post("http://web:5000/update-image-status",
              json={"id": key, "status": "PROCESSED"})

while True:
    messages = sqs.receive_message(
        QueueUrl=QUEUE_URL,
        MaxNumberOfMessages=5,
        WaitTimeSeconds=10,
    ).get("Messages", [])
    for message in messages:
        body = json.loads(message["Body"])
        key = body["key"]
        try:
            create_fake_thumbnail(key)
            sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=message["ReceiptHandle"])
        except Exception as ex:
            logging.exception("Failed processing %s", key)
    if not messages:
        time.sleep(10)