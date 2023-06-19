import { bindShopifyService, verifyRequest, verifyWebhookShopify } from '../middleware';
import {getCustomerMetafields, issueStoreCredit, updateStoreCredit, updateCreditCode, deleteMetafieldAndDisableGiftCard} from '../api'

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
    if (encryptedData) {
      await updateCreditCode(encryptedData, formattedCustomerId, shop, res, next);
    }
    res.status(204);
  } catch (error) {
    console.log('Error retrieving customer metafields:', error);
  }
});


export default router;