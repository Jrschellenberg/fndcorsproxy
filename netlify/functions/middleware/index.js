

import * as crypto from 'node:crypto';
const secret = process.env.SHARED_HASH_SECRET;

console.log(process.env.NODE_ENV)


// TODO: Add check to only do this on prod
export function verifyRequest(req, res, next) {
  const timestamp = req.get('X_FND_TIMESTAMP');
  const receivedHash = req.get('X_FND_HASH');

  try {
    if(!timestamp || !receivedHash){
      res.sendStatus(403);
    }

    const currentTimeStampSeconds = Math.floor(Date.now() / 1000);
    const requestedTimeStamp = parseInt(timestamp);
    // Timestamp is more than 10 seconds old
    if(currentTimeStampSeconds - requestedTimeStamp > 10) {
      res.sendStatus(403);
    }

    const hmac = crypto.createHmac('sha256', secret);

    // Assuming the timestamp is in string format
    hmac.update(timestamp);

    // Calculate the digest in the same format as the received hash
    const calculatedHash = hmac.digest('hex');

    // Compare the hashes
    if(calculatedHash !== receivedHash){
      res.sendStatus(403);
    }
    next()
  }
  catch(e) {
    res.sendStatus(403);
  }
}