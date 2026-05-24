const axios = require('axios');
require('dotenv').config({path: '../.env'});

async function run() {
  const coins = ['trx', 'ltc', 'doge', 'bch', 'dash', 'xrp', 'ada', 'matic', 'bnbbsc', 'sol', 'usdc'];
  console.log('Checking minimums...');
  for (let c of coins) {
    try {
      const r = await axios.get(`https://api.nowpayments.io/v1/min-amount?currency_from=usd&currency_to=${c}&fiat_equivalent=usd`, {
        headers: {'x-api-key': process.env.NOWPAYMENTS_API_KEY}
      });
      console.log(`${c.toUpperCase()}: Min $${r.data.fiat_equivalent}`);
    } catch(e) {
      console.log(`${c.toUpperCase()}: Error`);
    }
  }
}
run();
