import { bindShopifyService, verifyRequest } from '../middleware';
import {generateGiftCardCode, decrypt, encrypt} from '../helpers'

const express = require('express');
const router = express.Router();


router.post('/issue_store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
  const { amount, customerId, name, email, phone } = req.body;
  if(!amount || !customerId || !name || !email || !phone ){
    const err = new Error('Require field of "shop", "amount", "customerId, name, email, and phone"');
    err.status = 400;
    return next(err);
  }

  try {
    const response = await res.locals.shopify.post('/gift_cards.json', {
      "gift_card": {
        "note": `Store Credit for ${name}\nPhone:${phone}\nEmail:${email}`,
        "initial_value": amount.toString(),
        "code": generateGiftCardCode(customerId),
        "customer_id": customerId
      }
    });

  }
  catch(e) {
    console.error(e);
  }


  console.log(response);
  res.status(200).json({});
});

router.get('/', verifyRequest, async (req, res, next) => {
  console.log(process.env.NODE_ENV)
  res.status(200).json({hello: "world"})
})


export default router;