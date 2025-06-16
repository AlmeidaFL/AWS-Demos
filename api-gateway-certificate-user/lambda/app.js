exports.handler = async (event) => {
    console.log("Request received", event)

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello, world. mTLS"})
    }
}