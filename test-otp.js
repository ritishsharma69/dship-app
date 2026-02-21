require('dotenv').config({ path: './server/.env' })
const nodemailer = require('nodemailer')

async function testEmail() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env
  
  console.log('SMTP Config:')
  console.log('  Host:', SMTP_HOST)
  console.log('  Port:', SMTP_PORT)
  console.log('  User:', SMTP_USER)
  console.log('  Secure:', SMTP_SECURE)
  console.log('  Pass length:', SMTP_PASS?.length)
  
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    
    console.log('\nTesting email connection...')
    await transporter.verify()
    console.log('✓ Email connection successful!')
    
    // Send test email
    console.log('\nSending test OTP email...')
    const result = await transporter.sendMail({
      from: SMTP_USER,
      to: SMTP_USER,
      subject: 'Test OTP',
      text: 'Test OTP: 123456'
    })
    console.log('✓ Email sent:', result.messageId)
  } catch (err) {
    console.error('✗ Error:', err.message)
  }
  process.exit(0)
}

testEmail()
