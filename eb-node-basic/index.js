const http = require('http')

const port = process.env.PORT || 3000
const message = process.env.CUSTOM_MESSAGE || 'Message not found on env.config'

http.createServer((req, res) => {
    if (req.url === '/health'){
        res.writeHead(200, { "content-type": 'application/json'})
        return res.end(JSON.stringify({status: 'ok'}))
    }

    res.writeHead(200, { 'content-type': 'text/plain'})
    res.end(`This is a custom message: ${message}`)
}).listen(port)

console.log(`App running on port ${port}`)