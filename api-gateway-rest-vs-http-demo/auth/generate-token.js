import jwt from "jsonwebtoken";

const secret = "super-secret-key"

const payload = {
    sub: "user",
    role: "admin"
}

const token = jwt.sign(payload, secret, { expiresIn: "1h"})

console.log(token)