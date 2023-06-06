import * as crypto from 'node:crypto';
const secret = process.env.SHARED_HASH_SECRET;

const err = new Error('Forbidden');
err.status = 403;

export function verifyRequest(req, res, next) {
  if(process.env.NODE_ENV === 'development'){
    console.log("DOES IT HIT HERE?")
    return next();
  }

  const timestamp = req?.get('X_FND_TIMESTAMP');
  const receivedHash = req?.get('X_FND_HASH');

  try {
    if(!timestamp || !receivedHash){
      return next(err);
    }

    const currentTimeStampSeconds = Math.floor(Date.now() / 1000);
    const requestedTimeStamp = parseInt(timestamp);
    // Timestamp is more than 10 seconds old
    if(currentTimeStampSeconds - requestedTimeStamp > 10) {
      return next(err);
    }

    const hmac = crypto.createHmac('sha256', secret);

    // Assuming the timestamp is in string format
    hmac.update(timestamp);

    // Calculate the digest in the same format as the received hash
    const calculatedHash = hmac.digest('hex');

    // Compare the hashes
    if(calculatedHash !== receivedHash){
      return next(err);
    }
    return next()
  }
  catch(e) {
    return next(err);
  }
}