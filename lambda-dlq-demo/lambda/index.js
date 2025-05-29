exports.handler = async (event) => {
    console.log("Event: ", event);
    throw new Error("Test error from lambda function");
}