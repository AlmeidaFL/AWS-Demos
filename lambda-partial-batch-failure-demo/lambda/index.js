exports.handler = async (event) => {
    console.log(`Received batch with ${event.Records.length} messages`)

    const batchItemFailures = []

    for (const record of event.Records){
        console.log(`Processing message with body=${record.body}`)
        if (record.body.trim().toLowerCase() === "fail"){
            console.log(`Simulating failure for mesageId=${record.messageId}`)
            batchItemFailures.push({ itemIdentifier: record.messageId})
        } else {
            console.log(`Succes processing messageId=${record.messageId}`)
        }
    }

    const result = { batchItemFailures }
    console.log("Returning:", JSON.stringify(result))

    return result
}