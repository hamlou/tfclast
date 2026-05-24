require('dotenv').config({path: '../.env'});
const axios = require('axios');

async function checkResendLogs() {
  try {
    const response = await axios.get('https://api.resend.com/emails', {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
    });
    console.log(JSON.stringify(response.data.data.slice(0, 5), null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkResendLogs();
