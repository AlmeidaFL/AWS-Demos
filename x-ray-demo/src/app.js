const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");
const AWSXRay = require("aws-xray-sdk");

const dbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
const dbDocClient = DynamoDBDocumentClient.from(dbClient)

const tableName = process.env.TABLE_NAME

exports.handler = async (event) => {
    try {    
        const body = JSON.parse(event.body || '{}')
        if (!body.product || !body.quantity){
            return {
                statusCode: 400,
                body: JSON.stringify({message: 'Invalid schema data', body: event.body})
            }
        }

        const orderId = randomUUID()
        const mainSegment = AWSXRay.getSegment()

        await AWSXRay.captureAsyncFunc('Order_Validation', async (subsegment) => {
            subsegment.addAnnotation("ValidationSystem", "ValidationSystem_Value1")

            console.log("Iniciating validation")
            await new Promise(resolve => setTimeout(resolve, 200))
            console.log("End validation")

            subsegment.close()
        })

        const orderMetadata = {
            orderId: orderId,
            details: body,
            client: { id: 'fake client', segment: 'premium'}
        }
        mainSegment.addMetadata('orderDetails', orderMetadata, 'Processing')

        console.log(`Saving order ${orderId} on DynamoDB`)
        const command = new PutCommand({
            TableName: tableName,
            Item: {
                id: orderId,
                product: body.product,
                quantity: body.quantity
            }
        })
        await dbDocClient.send(command)
        console.log("Order saved")

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Order processed succesfully',
                orderId: orderId
            })
        }
    } catch (ex) {
        console.error(ex)
        const segment = AWSXRay.getSegment()
        segment.addAnnotation('Error', 'true')
        segment.addMetadata('Stack Trace', ex.stack)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal error" })
        }
    }
}