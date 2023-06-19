import * as crypto from 'node:crypto';
import shopifyService from '../services/shopifyService.js';
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


export const verifyWebhookShopify = (req, res, next) => {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const webhookKey = process.env.WEBHOOK_KEY;

  console.log(webhookKey, "Shopify secret key?");

  const requestBody = JSON.stringify(req.body);

  const generatedHash = crypto
    .createHmac('sha256', webhookKey)
    .update(requestBody, 'utf8')
    .digest('base64');

  console.log("Hash is", generatedHash, hmacHeader);
  if (generatedHash !== hmacHeader) {
    console.log('nope')
    return res.sendStatus(403);
  }

  next();
};



export function bindShopifyService(req, res, next) {
  const err = new Error('No Shop URL Provided');
  err.status = 400;

  let store;

  if (req?.get('X_FND_STORE')) {
    store =  req?.get('X_FND_STORE');
  } else if (req.headers['x-shopify-shop-domain']) {
    if (req.headers['x-shopify-shop-domain'].includes('usa')) {
      store = 'US'
    } else {
      store = 'CAD'
    }
  } else {
    return next(err);
  }

  console.log("STORE IS ", store);
  if(store === 'US'){
    res.locals.shopify = shopifyService.unitedStates;
  }
  else if(store === 'CAD'){
    res.locals.shopify = shopifyService.canada;
  }
  console.log("did we hit this shit?");
  next();
}