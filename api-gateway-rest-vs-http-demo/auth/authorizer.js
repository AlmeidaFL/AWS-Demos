const jwt = require("jsonwebtoken");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient();

let secret;

const allowedUsersWithRoles = {
    "user": ["admin"]
}
const nonAuthorizedPayload = {
    isAuthorized: false
}

exports.handler = async (event) => {
    if (!secret) {
        const paramName = process.env.JWT_SECRET_PARAM

        try {
            const command = new GetParameterCommand({
                Name: paramName,
                WithDecryption: true
            });

            const result = await ssmClient.send(command);
            secret = result.Parameter.Value;
        } catch (ssmError) {
            return nonAuthorizedPayload;
        }
    } else {
        console.log('Using cached secret');
    }

    const authHeader = event.headers.authorization || ""
    
    let token;

    if (authHeader.startsWith("Bearer ")){
        token = authHeader.slice(7).trim() // Removing Bearer
    } else {
        token = authHeader.trim()
    }

    if (!token){
        return nonAuthorizedPayload
    }

    try {
        const payload = jwt.verify(token, secret)
        const { sub, role } = payload

        if (!allowedUsersWithRoles[sub] || !allowedUsersWithRoles[sub].includes(role)){
            return nonAuthorizedPayload
        }
        
        return {
            isAuthorized: true,
            context: {
                userId: sub,
                role: role
            }
        }
    } catch (ex) {
        console.error(`JWT verification failed: ${ex.message}`, ex);
        return nonAuthorizedPayload
    }
}