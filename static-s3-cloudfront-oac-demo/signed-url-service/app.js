const crypto = require('crypto')
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient();

const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL

exports.handler = async (event) => {
    const path = event.queryStringParameters?.path || '/index.html'
    const expires = Math.floor(Date.now() / 1000) + 60 // 1 minute

    const privateKey = await getParam(process.env.CF_PRIVATE_KEY_PARAM, true)
    const keyPairId = await getParam(process.env.CF_KEY_PAIR_ID_PARAM)
    

    console.log(`Cloudfront url : ${CLOUDFRONT_URL} path ${path} private key ${privateKey} keyPairId ${keyPairId}`)
    const policy = JSON.stringify({
        Statement: [{
            Resource: `${CLOUDFRONT_URL}${path}`,
            Condition: {
                DateLessThan: { 'AWS:EpochTime': expires }
            }
        }]
    })

    const signer = crypto.createSign('RSA-SHA1')
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
    const command = new GetParameterCommand({
        Name: name,
        WithDecryption: decrypt
    });
    const result = await ssmClient.send(command)
    return result.Parameter.Value
}