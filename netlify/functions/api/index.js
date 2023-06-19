import {generateGiftCardCode, decrypt, encrypt} from '../helpers'

export async function getCustomerMetafields(customerId, shop) {
  const apiUrl = `/graphql.json`;
  const query = `
    query($customerId: ID!) {
      customer(id: $customerId) {
        metafields(first: 10) {
          edges {
            node {
              id
              key
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await shop.post(apiUrl, { query, variables: { customerId }});

    const customerMetafields = response.data.data.customer.metafields.edges.map(edge => edge.node);
    return customerMetafields;
  } catch (error) {
    console.error('Failed to retrieve customer metafields:', error);
    return null;
  }
}

export async function issueStoreCredit(amount, customerId, shop, res, next) {
  if(!amount || !customerId ){
    const err = new Error('Require field of "amount", "customerId"');
    err.status = 400;
    return next(err);
  }

  try {
    let response = await shop.post('/gift_cards.json', {
      "gift_card": {
        "customer_id": customerId,
        "note": `App Issued Store Credit`,
        "initial_value": amount.toString(),
        "code": generateGiftCardCode(customerId),
        "template_suffix": "store_credit",
      }
    });

    const encryptedGiftCardData = encrypt(response?.data?.gift_card);

    await shop.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "customer_id": customerId,
        "namespace": "fnd",
        "key": "encrypted_gift_card",
        "type": "single_line_text_field",
        "value": encryptedGiftCardData,
      }
    });

    await shop.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "customer_id": customerId,
        "namespace": "fnd",
        "key": "store_credit",
        "type": "number_decimal",
        "value": "0.00"
      }
    });

    return res.status(201).json({
      message: `Successfully Issued Store Credit Stored as ${encryptedGiftCardData}`
    });
  }
  catch(e) {
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
};


export async function updateStoreCredit(amount, encryptedData, customerId, shop, res, next) {
  if(!encryptedData || !customerId || !amount ){
    const err = new Error('Require field of "encryptedData", "customerId" and "amount"');
    err.status = 400;
    return next(err);
  }

  const decryptedData = decrypt(encryptedData);

  try {
    let response = await shop.get(`/gift_cards/${decryptedData.id}.json`);

    const { id, balance, disabled_at } = response.data?.gift_card;

    let total = amount;
    let wasPreviousAmount = false;

    if(!disabled_at && parseFloat(balance) > 0 ){
      total += parseFloat(balance);
      wasPreviousAmount = true;
      await shop.post(`/gift_cards/${id}/disable.json`);
    }


    const giftCardNote = wasPreviousAmount
        ? `App Issued Store Credit\nPrevious Gift Card ${id} had Total of ${balance} and Carried Forward Balance`
        : `App Issued Store Credit`

    response = await shop.post('/gift_cards.json', {
      "gift_card": {
        "customer_id": customerId,
        "note": giftCardNote,
        "initial_value": total.toString(),
        "code": generateGiftCardCode(customerId),
        "template_suffix": "store_credit",
      }
    });

    const encryptedGiftCardData = encrypt(response?.data?.gift_card);

    await shop.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "customer_id": customerId,
        "namespace": "fnd",
        "key": "encrypted_gift_card",
        "type": "single_line_text_field",
        "value": encryptedGiftCardData,
      }
    });

    await shop.post(`/customers/${customerId}/metafields.json`, {
      "metafield": {
        "customer_id": customerId,
        "namespace": "fnd",
        "key": "store_credit",
        "type": "number_decimal",
        "value": "0.00"
      }
    });

    return res.status(201).json({
      message: `Successfully Updated Store Credit Stored as ${encryptedGiftCardData}`
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
};


export async function updateCreditCode(encryptedData, customerId, shop, res, next) {
  try {
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

    let response = await shop.get(`/gift_cards/${decryptedData.id}.json`);
    const { id, balance, disabled_at } = response.data?.gift_card;
    const isDisabled = !disabled_at;
    console.log(1)
    console.log(response.data?.gift_card)
    if(isDisabled || parseFloat(balance) <= 0 ){
      response = await shop.get(`/customers/${customerId}/metafields.json`)
      const metaFieldToDelete = response?.data?.metafields.find(f => f.namespace === 'fnd' && f.key === 'encrypted_gift_card' )
      console.log(2, id)
      if(metaFieldToDelete){
        await shop.post(`/gift_cards/${id}/disable.json`);
        console.log(3)
        await shop.delete(`/customers/${customerId}/metafields/${metaFieldToDelete.id}.json`);
        console.log(4)
      }
    }

    return res.status(200).json({
      message: `Success`,
      code: decryptedData.code,
      balance: parseFloat(balance),
      isDisabled,
    });
  }
  catch(e){
    console.log(e.message)
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
};

export async function deleteMetafieldAndDisableGiftCard(encryptedData, customerId, shop, res, next) {
  try {
    if(!encryptedData || !customerId  ){
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

    let response = await shop.get(`/gift_cards/${decryptedData.id}.json`);
    const { id } = response.data?.gift_card;

    response = await shop.get(`/customers/${customerId}/metafields.json`)
    const metaFieldToDelete = response?.data?.metafields
        .find(f => f.namespace === 'fnd' && f.key === 'encrypted_gift_card' )
    if(metaFieldToDelete){
      await shop.post(`/gift_cards/${id}/disable.json`);
      await shop.delete(`/customers/${customerId}/metafields/${metaFieldToDelete.id}.json`);
    }

    return res.status(200).json({
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
}