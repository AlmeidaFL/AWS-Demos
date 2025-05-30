exports.handler = async (event) => {
    console.log("Event received: ", event)

    if (event.shouldFail){
        console.log("Simulating failure...")
        throw new Error("Simulated failure from inside index.js")
    } else {
        console.log("Simulating success...")
        return {
            statusCode: 200,
            body: "Success from inside index.js"
        }
    }
}