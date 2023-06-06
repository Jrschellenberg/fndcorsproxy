import { verifyRequest } from '../middleware';

const express = require('express');


const router = express.Router();

const updateOrder = async (id, payload, retryTimes= 5) => {
  res.status(200);
}

router.post('/order_created', verifyRequest, async (req, res, next) => {
  // const body = JSON.parse(req.body.toString());
  // const { id } = body;
  // const noteAttributes = body?.note_attributes ?? {}
  // const isShipping = body?.shipping_address;
  //
  // await updateOrder(id, {
  //   "note_attributes": [
  //       ...noteAttributes,
  //       {
  //       "name": `order_type`,
  //       "value": `${isShipping ? 'Standard Delivery' : 'Local Pickup'}`
  //     }
  //   ]
  // }, 1);

  res.status(200);
});

router.get('/', verifyRequest, async (req, res, next) => {
  res.json({hello: "world"})
})


export default router;