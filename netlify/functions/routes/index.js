import { verifyRequest } from '../middleware';

const express = require('express');
const router = express.Router();


router.post('/order_created', verifyRequest, async (req, res, next) => {
  res.status(200);
});

router.get('/', verifyRequest, async (req, res, next) => {
  console.log(process.env.NODE_ENV)
  res.status(200).json({hello: "world"})
})


export default router;