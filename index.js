import * as crypto from 'node:crypto';


const key = crypto.randomBytes(32);

// Initialization vector.
const iv = crypto.randomBytes(16);

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

const decryptedData = decrypt("161b1b607e055614b99b0ac03d224b02");
console.log('Decrypted data:', decryptedData);