import * as crypto from 'node:crypto';


const key = crypto.createHash('sha256').update(process.env.PRIVATE_KEY).digest();
const iv = crypto.createHash('md5').update(process.env.PRIVATE_IV).digest();

// Constant Salt is used for testing to not affect customer ID but update things.
const CONSTANT_SALT = '3'

export function encrypt(data) {
  const string = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encryptedData = cipher.update(string, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}

export function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return JSON.parse(decryptedData);
}

export function generateGiftCardCode(input) {
  const sha1 = crypto.createHash('sha1');
  sha1.update(input.toString() + CONSTANT_SALT);
  const fullHash = sha1.digest('hex');
  const partialHash = fullHash.substring(0, 16);
  return `${partialHash}${process.env.NODE_ENV === 'development' ? 'TEST' : 'CRED' }`;
}