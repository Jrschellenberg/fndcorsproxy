import * as crypto from 'node:crypto';

import VerifyHash from '../middleware/verifyHash.js'


const key = crypto.createHash('sha256').update(process.env.PRIVATE_KEY).digest();
const iv = crypto.createHash('md5').update(process.env.PRIVATE_IV).digest();

// Test the function


export const handler = async (event, context) => {
  console.log("Event", event.headers)
  console.log(event.body)
  console.log(context, "context");

  const timestamp = event.headers?.['X_FND_TIMESTAMP'];
  const receivedHash = event.headers?.['X_FND_HASH'];

  // if(!VerifyHash(timestamp, receivedHash)){
  //   return {
  //     statusCode: 403,
  //     body: JSON.stringify({
  //       data: 'Forbidden'
  //     })
  //   }
  // }

// Encrypt some data.
  function encrypt(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
  }

// Decrypt some data.
  function decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    return decryptedData;
  }

// Test
  const data = 'Hello, Worddld!';
  const encryptedData = encrypt(data);
  console.log('Encrypted data:', encryptedData);

  const decryptedData = decrypt(encryptedData);
  console.log('Decrypted data:', decryptedData);


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Encrypted ${encryptedData}\n\nDecrypted: ${decryptedData.toString()}`
    })
  }
}