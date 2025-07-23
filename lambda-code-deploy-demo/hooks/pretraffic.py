import boto3, json

client = boto3.client("codedeploy")

def lambda_handler(event, context):
    deployment_id = event["DeploymentId"]
    execution_id  = event["LifecycleEventHookExecutionId"]

    try:
        validation_passed = True
    except Exception as e:
        print("Test error:", e)
        validation_passed = False

    client.put_lifecycle_event_hook_execution_status(
        deploymentId = deployment_id,
        lifecycleEventHookExecutionId = execution_id,
        status = "Succeeded" if validation_passed else "Failed"
    )

    return {"status": "Succeeded" if validation_passed else "Failed"}
