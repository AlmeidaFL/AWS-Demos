import json
import base64

def handler(event, context):
    for record in event["Records"]:
        payload = base64.b64decode(record["kinesis"]["data"])
        decoded_json = json.loads(payload.decode())
        print("Decoded payload: ", decoded_json)
        print("Entirely payload", event)