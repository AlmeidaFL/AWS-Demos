exports.handler = async (event) => {
    const name = (event.pathParameters && event.pathParameters.name) || "world";
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            message: `Hello, ${name}`,
        })
    };
};