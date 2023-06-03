import * as crypto from 'node:crypto';

const secret = 'super secret';

function verifyHash(timestamp, receivedHash) {
  const hmac = crypto.createHmac('sha256', secret);

  // Assuming the timestamp is in string format
  hmac.update(timestamp);

  // Calculate the digest in the same format as the received hash
  const calculatedHash = hmac.digest('hex');

  // Compare the hashes

  if(calculatedHash !== receivedHash) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        data: 'Forbidden'
      })
    }
  }
}

// Test the function
const timestamp = '1638232023';
const receivedHash = '5c776e7be63b582484f12e4841dbfc5f8c4a34e1001063cfcd5f72f87e3c85f0';

console.log(verifyHash(timestamp, receivedHash));