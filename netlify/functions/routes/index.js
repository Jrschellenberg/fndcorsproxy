import { bindShopifyService, verifyRequest } from '../middleware';
import {generateGiftCardCode, decrypt, encrypt} from '../helpers'

const express = require('express');
const router = express.Router();


router.post('/store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
  const { amount, customerId, name, email, phone } = req.body;
  if(!amount || !customerId || !name || !email || !phone ){
    const err = new Error('Require field of "shop", "amount", "customerId, name, email, and phone"');
    err.status = 400;
    return next(err);
  }

  try {
    let response = await res.locals.shopify.post('/gift_cards.json', {
      "gift_card": {
        "note": `Store Credit for ${name}\nPhone:${phone}\nEmail:${email}`,
        "initial_value": amount.toString(),
        "code": generateGiftCardCode(customerId),
        "customer_id": customerId
      }
    });

    console.log("did we get here?");

    const encryptedGiftCardData = encrypt(response?.data?.gift_card);

    console.log("EncryptedGiftCardData is ", encryptedGiftCardData)

    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "encrypted_gift_card",
        "type": "single_line_text_field",
        "value": encryptedGiftCardData,
      }
    });

    console.log("SECOND d2id we get here?")


    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "store_credit",
        "type": "number_decimal",
        "value": "0.00"
      }
    });

    console.log("THIRD did we get here?")

    res.status(201).json({
      message: `Successfully Issued Store Credit Stored as ${encryptedGiftCardData}`
    });
  }
  catch(e) {
    e = e.toJSON();
    const err = new Error(`Shopify Err: ${e.message}`)
    err.status = e.status;
    return next(err)
  }
});

router.get('/', verifyRequest, async (req, res, next) => {
  console.log(process.env.NODE_ENV)
  res.status(200).json({hello: "world"})
})


export default router;