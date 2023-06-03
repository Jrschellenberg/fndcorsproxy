import * as crypto from 'node:crypto';

const secret = process.env.SHARED_HASH_SECRET;

export default function verifyHash(timestamp, receivedHash) {
  if(!timestamp || !receivedHash){
    return false;
  }
  console.log("Secret is ", secret);
  const hmac = crypto.createHmac('sha256', secret);

  // Assuming the timestamp is in string format
  hmac.update(timestamp);

  // Calculate the digest in the same format as the received hash
  const calculatedHash = hmac.digest('hex');

  // Compare the hashes

  console.log(calculatedHash, receivedHash, timestamp)

  return calculatedHash === receivedHash;
}