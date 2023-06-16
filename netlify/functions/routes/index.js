import { bindShopifyService, verifyRequest, verifyWebhookShopify } from '../middleware';
import {generateGiftCardCode, decrypt, encrypt} from '../helpers'

const express = require('express');
const router = express.Router();

router.post('/', verifyWebhookShopify, async (req, res, next) => {
  console.log("req.body ", req.body);
})
// router.post('/store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
//   const { amount, customerId } = req.body;
//   if(!amount || !customerId ){
//     const err = new Error('Require field of "amount", "customerId"');
//     err.status = 400;
//     return next(err);
//   }

//   try {
//     let response = await res.locals.shopify.post('/gift_cards.json', {
//       "gift_card": {
//         "note": `App Issued Store Credit`,
//         "initial_value": amount.toString(),
//         "code": generateGiftCardCode(customerId),
//         "customer_id": customerId,
//         "template_suffix": "store_credit",
//       }
//     });

//     const encryptedGiftCardData = encrypt(response?.data?.gift_card);

//     await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
//       "metafield": {
//         "namespace": "fnd",
//         "key": "encrypted_gift_card",
//         "type": "single_line_text_field",
//         "value": encryptedGiftCardData,
//       }
//     });

//     await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
//       "metafield": {
//         "namespace": "fnd",
//         "key": "store_credit",
//         "type": "number_decimal",
//         "value": "0.00"
//       }
//     });

//     res.status(201).json({
//       message: `Successfully Issued Store Credit Stored as ${encryptedGiftCardData}`
//     });
//   }
//   catch(e) {
//     try {
//       e = e.toJSON();
//       const err = new Error(`Shopify Err: ${e.message}`)
//       err.status = e.status;
//       return next(err)
//     }
//     catch(e){
//       const err = new Error("Unknown error")
//       err.status = 500;
//       return next(err);
//     }
//   }
// });


// router.put('/store_credit', verifyRequest, bindShopifyService, async (req, res, next) => {
//   const { amount, encryptedData, customerId } = req.body;
//   if(!encryptedData || !customerId || !amount ){
//     const err = new Error('Require field of "encryptedData", "customerId" and "amount"');
//     err.status = 400;
//     return next(err);
//   }

//   const decryptedData = decrypt(encryptedData);

//   try {
//     let response = await res.locals.shopify.get(`/gift_cards/${decryptedData.id}.json`);

//     const { id, balance, disabled_at } = response.data?.gift_card;

//     let total = amount;
//     let wasPreviousAmount = false;
//     if(!disabled_at && parseFloat(balance) > 0 ){
//       total += parseFloat(balance);
//       wasPreviousAmount = true;
//       await res.locals.shopify.post(`/gift_cards/${id}/disable.json`);
//     }


//     const giftCardNote = wasPreviousAmount
//         ? `App Issued Store Credit\nPrevious Gift Card ${id} had Total of ${balance} and Carried Forward Balance`
//         : `App Issued Store Credit`

//     response = await res.locals.shopify.post('/gift_cards.json', {
//       "gift_card": {
//         "note": giftCardNote,
//         "initial_value": total.toString(),
//         "code": generateGiftCardCode(customerId),
//         "customer_id": customerId,
//         "template_suffix": "store_credit",
//       }
//     });

//     const encryptedGiftCardData = encrypt(response?.data?.gift_card);

//     await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
//       "metafield": {
//         "namespace": "fnd",
//         "key": "encrypted_gift_card",
//         "type": "single_line_text_field",
//         "value": encryptedGiftCardData,
//       }
//     });

//     await res.locals.shopify.post(`/customers/${customerId}/metafields.json`, {
//       "metafield": {
//         "namespace": "fnd",
//         "key": "store_credit",
//         "type": "number_decimal",
//         "value": "0.00"
//       }
//     });

//     res.status(201).json({
//       message: `Successfully Updated Store Credit Stored as ${encryptedGiftCardData}`
//     });

//   }
//   catch(e){
//     try {
//       e = e.toJSON();
//       const err = new Error(`Shopify Err: ${e.message}`)
//       err.status = e.status;
//       return next(err)

//     }
//     catch(e){
//       const err = new Error("Unknown error")
//       err.status = 500;
//       return next(err);
//     }
//   }
// });

// router.post('/store_credit/code', verifyRequest, bindShopifyService, async (req, res, next) => {
//   try {
//     const { encryptedData, customerId } = req.body;
//     if(!encryptedData  ){
//       const err = new Error('Require field of "encryptedData", "customerId"');
//       err.status = 400;
//       return next(err);
//     }

//     const decryptedData = decrypt(encryptedData);

//     if(decryptedData.customer_id !== customerId){
//       const err = new Error('Unauthorized');
//       err.status = 401;
//       return next(err)
//     }

//     let response = await res.locals.shopify.get(`/gift_cards/${decryptedData.id}.json`);
//     const { id, balance, disabled_at } = response.data?.gift_card;

//     const isDisabled = !!disabled_at;

//     if(isDisabled || parseFloat(balance) <= 0 ){
//       response = await res.locals.shopify.get(`/customers/${customerId}/metafields.json`)
//       const metaFieldToDelete = response?.data?.metafields
//           .find(f => f.namespace === 'fnd' && f.key === 'encrypted_gift_card' )
//       if(metaFieldToDelete){
//         await res.locals.shopify.post(`/gift_cards/${id}/disable.json`);
//         await res.locals.shopify.delete(`/customers/${customerId}/metafields/${metaFieldToDelete.id}.json`);
//       }
//     }

//     res.status(200).json({
//       message: `Success`,
//       code: decryptedData.code,
//       balance: parseFloat(balance),
//       isDisabled,
//     });
//   }
//   catch(e){
//     try {
//       e = e.toJSON();
//       const err = new Error(`Shopify Err: ${e.message}`)
//       err.status = e.status;
//       return next(err)
//     }
//     catch(e){
//       const err = new Error("Unknown error")
//       err.status = 500;
//       return next(err);
//     }
//   }
// });


export default router;