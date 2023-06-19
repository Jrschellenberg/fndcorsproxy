import { bindShopifyService, verifyRequest, verifyWebhookShopify } from '../middleware';
import {getCustomerMetafields, issueStoreCredit, updateStoreCredit, deleteMetafieldAndDisableGiftCard} from '../api'

const express = require('express');
const router = express.Router();


router.post('/webhook/customer/update', bindShopifyService, async (req, res, next) => {
  const customerId = req?.body?.admin_graphql_api_id;
  const shop = res.locals.shopify;
  let customerMetafields = null;

  try {
    customerMetafields = await getCustomerMetafields(customerId, shop);
    console.log(customerMetafields)
    const deleteStoreCreditField = customerMetafields.find(field => field.key === 'delete_store_credit') || null;
    const storeCreditField = customerMetafields.find(field => field.key === 'store_credit') || null;
    const storeCreditEncryptedDataField = customerMetafields.find(field => field.key === 'encrypted_gift_card') || null;

    const deleteStoreCredit = deleteStoreCreditField?.value === 'true' ? true : false;
    const storeCreditAmount = parseFloat(storeCreditField?.value) || 0;
    const encryptedData = storeCreditEncryptedDataField?.value || null;
    const formattedCustomerId = parseInt(customerId?.split('/')?.reverse()[0]);

    if (deleteStoreCredit) {
      await deleteMetafieldAndDisableGiftCard(encryptedData, formattedCustomerId, shop, res, next);
    }
    else if (storeCreditAmount !== 0 && encryptedData) {
      await updateStoreCredit(storeCreditAmount, encryptedData, formattedCustomerId, shop, res, next);
    } else if (storeCreditAmount !== 0) {
      await issueStoreCredit(storeCreditAmount, formattedCustomerId, shop, res, next);
    }
    res.status(204);
  } catch (error) {
    console.log('Error retrieving customer metafields:', error);
  }
});

router.post('/store_credit/code', verifyRequest, bindShopifyService, async (req, res, next) => {
  try {
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

    let response = await res.locals.shopify.get(`/gift_cards/${decryptedData.id}.json`);
    const { id, balance, disabled_at } = response.data?.gift_card;

    const isDisabled = !!disabled_at;

    if(isDisabled || parseFloat(balance) <= 0 ){
      response = await res.locals.shopify.get(`/customers/${customerId}/metafields.json`)
      const metaFieldToDelete = response?.data?.metafields
          .find(f => f.namespace === 'fnd' && f.key === 'encrypted_gift_card' )
      if(metaFieldToDelete){
        await res.locals.shopify.post(`/gift_cards/${id}/disable.json`);
        await res.locals.shopify.delete(`/customers/${customerId}/metafields/${metaFieldToDelete.id}.json`);
      }
    }

    res.status(200).json({
      message: `Success`,
      code: decryptedData.code,
      balance: parseFloat(balance),
      isDisabled,
    });
  }
  catch(e){
    try {
      e = e.toJSON();
      const err = new Error(`Shopify Err: ${e.message}`)
      err.status = e.status;
      return next(err)
    }
    catch(e){
      const err = new Error("Unknown error")
      err.status = 500;
      return next(err);
    }
  }
});

export default router;