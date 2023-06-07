import { bindShopifyService, verifyRequest } from '../middleware';
import {generateGiftCardCode, decrypt, encrypt} from '../helpers'

const express = require('express');
const router = express.Router();


router.post('/store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
  const { amount, customerId } = req.body;
  if(!amount || !customerId ){
    const err = new Error('Require field of "amount", "customerId"');
    err.status = 400;
    return next(err);
  }

  try {
    let response = await res.locals.shopify.post('/gift_cards.json', {
      "gift_card": {
        "note": `App Issued Store Credit`,
        "initial_value": amount.toString(),
        "code": generateGiftCardCode(customerId),
        "customer_id": customerId
      }
    });

    const encryptedGiftCardData = encrypt(response?.data?.gift_card);

    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "encrypted_gift_card",
        "type": "single_line_text_field",
        "value": encryptedGiftCardData,
      }
    });

    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "store_credit",
        "type": "number_decimal",
        "value": "0.00"
      }
    });

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


router.put('/store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
  const { amount, encryptedData, customerId } = req.body;
  if(!encryptedData || !customerId || !amount ){
    const err = new Error('Require field of "encryptedData", "customerId" and "amount"');
    err.status = 400;
    return next(err);
  }

  const decryptedData = decrypt(encryptedData);

  try {
    let response = await res.locals.shopify.get(`/gift_cards/${decryptedData.id}.json`);

    const { id, balance, disabled_at } = response.data?.gift_card;

    let total = amount;
    if(!disabled_at && parseFloat(balance) > 0 ){
      total += parseFloat(balance);
      await res.locals.shopify.post(`/gift_cards/${id}/disable.json`);
    }


    response = await res.locals.shopify.post('/gift_cards.json', {
      "gift_card": {
        "note": `App Issued Store Credit`,
        "initial_value": total.toString(),
        "code": generateGiftCardCode(customerId),
        "customer_id": customerId
      }
    });

    const encryptedGiftCardData = encrypt(response?.data?.gift_card);

    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "encrypted_gift_card",
        "type": "single_line_text_field",
        "value": encryptedGiftCardData,
      }
    });

    await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "namespace": "fnd",
        "key": "store_credit",
        "type": "number_decimal",
        "value": "0.00"
      }
    });

    res.status(201).json({
      message: `Successfully Updated Store Credit Stored as ${encryptedGiftCardData}`
    });

  }
  catch(e){
    e = e.toJSON();
    const err = new Error(`Shopify Err: ${e.message}`)
    err.status = e.status;
    return next(err)
  }
});

router.post('/store_credit/code', verifyRequest, async (req, res, next) => {
  const { encryptedData, customerId } = req.body;
  if(!encryptedData  ){
    const err = new Error('Require field of "encryptedData", "customerId"');
    err.status = 400;
    return next(err);
  }

  const decryptedData = decrypt(encryptedData);

  if(decryptedData.customer_id !== customerId){
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err)
  }

  res.status(200).json({
    message: `Success`,
    code: decryptedData.code,
  });
});


export default router;