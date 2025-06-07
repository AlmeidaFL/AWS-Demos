exports.handler = async (event) => {
    console.log("Event on main func:", event)
    const name = (event.pathParameters && event.pathParameters.name) || "world";
     
    const queryParameters = event.queryStringParameters || {}
    const filter = queryParameters.filter || ""
    const size = queryParameters.size || ""

    console.log("Its returning from main func")
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            message: `Hello, ${name}. With filter ${filter} and size ${size}`,
            event: event
        })
    };
};