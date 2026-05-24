require('dotenv').config({path: '../.env'});
const { Resend } = require('resend');
const fs = require('fs');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    // Create a dummy file
    fs.writeFileSync('test_dummy.jpg', 'fake image content');
    
    const attachments = [{
      filename: 'Profile_test_dummy.jpg',
      content: fs.readFileSync('test_dummy.jpg')
    }];

    const data = await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: 'contact@tfc-event.com',
      subject: 'Test Email with Attachment',
      html: '<p>This is a test email to verify attachments.</p>',
      attachments
    });
    console.log('✅ Success:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (fs.existsSync('test_dummy.jpg')) fs.unlinkSync('test_dummy.jpg');
  }
}

testEmail();
