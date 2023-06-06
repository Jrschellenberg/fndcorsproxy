import axios from 'axios';
import axiosRetry from 'axios-retry';

const axiosretryConfig = {
  retries: 25,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (a) => {
    return a?.response?.status?.toString() === '5';
  },
  onRetry: (number, e) => {
    console.log(`Failed ${number} times with status ${e?.response?.status}`)
    console.log(e?.response?.message)
  }
}

class ShopifyService {
  constructor() {
    this.canada = axiosRetry(axios.create({
      baseURL: `https://smack-pet-food-usa.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/`,
      headers: {
        'X-Shopify-Access-Token' : process.env.SMACK_CAD_AUTH,
      }
    }), axiosretryConfig);

    this.unitedStates = axiosRetry(axios.create({
      baseURL: `https://smack-pet-food-usa.myshopify.com/admin/api/${process.env.SHOPIFY_API_VERSION}/`,
      headers: {
        'X-Shopify-Access-Token' : process.env.SMACK_USD_AUTH,
      }
    }), axiosretryConfig);
  }
}

export default new ShopifyService();