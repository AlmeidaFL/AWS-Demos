const fs = require('fs')
const crypto = require('crypto')
const AWS = require('aws-sdk')
const ssm = new AWS.SSM()

const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL

exports.handler = async (event) => {
    const path = event.queryStringParameters?.path || '/index.html'
    const expires = Math.floor(Date.now() / 1000) + 60 // 1 minute

    const privateKey = await getParam(process.env.CF_PRIVATE_KEY_PARAM, true)
    const keyPairId = await getParam(process.env.CF_KEY_PAIR_ID)

    const policy = JSON.stringify({
        Statement: [{
            Resource: `${CLOUDFRONT_URL}${path}`,
            Condition: {
                DateLessThan: { 'AWS:EpochTime': expires }
            }
        }]
    })

    const signer = crypto.sign('RSA-SHA1')
    signer.update(policy)
    const signature = toCloudFrontSafeBase64(signer.sign(privateKey, 'base64'))
    const encondedPolicy = toCloudFrontSafeBase64(Buffer.from(policy).toString('base64'))

    const signedUrl = `${CLOUDFRONT_URL}${path}?Policy=${encondedPolicy}&Signature=${signature}&Key-Pair-Id=${keyPairId}`

    return {
        statusCode: 200,
        body: JSON.stringify({ signed_url: signedUrl })
    }
}

function toCloudFrontSafeBase64(input) {
  return input.replace(/\+/g,'-').replace(/=/g,'_').replace(/\//g,'~');
}

async function getParam(name, decrypt = false){
    const result = await ssm.getParameter( {Name: name, WithDecryption: decrypt}).promise()
    return result.Parameter.Value
}