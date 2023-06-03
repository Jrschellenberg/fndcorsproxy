import * as crypto from 'node:crypto';


const key = crypto.createHash('sha256').update(process.env.PRIVATE_KEY).digest();
const iv = crypto.createHash('md5').update(process.env.PRIVATE_IV).digest();



export const handler = async () => {

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