require('dotenv').config({path: '../.env'});
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: 'contact@tfc-event.com',
      subject: 'Test Email from TFC Server',
      html: '<p>This is a test email to verify Resend configuration.</p>'
    });
    console.log('✅ Success:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
