import * as crypto from 'node:crypto';


const key = crypto.createHash('sha256').update(process.env.PRIVATE_KEY).digest();
const iv = crypto.createHash('md5').update(process.env.PRIVATE_IV).digest();


export function encrypt(data) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}

export function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
}

export function generateGiftCardCode(input) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(input.toString());
  const fullHash = sha1.digest('hex');
  const partialHash = fullHash.substring(0, 16);
  return `${partialHash}${process.env.NODE_ENV === 'development' ? 'TEST' : 'CRED' }`;
}