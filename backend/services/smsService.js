const twilio = require('twilio');

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const sendSMS = async (to, message) => {
  if (!client) {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return;
  }
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to.startsWith('+') ? to : `+91${to}`,
    });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

exports.sendOTPSMS = async (phone, otp) => {
  const msg = `Your DigiGold OTP is ${otp}. Valid for 10 minutes. Do NOT share with anyone. -DigiGold`;
  await sendSMS(phone, msg);
};

exports.sendTransactionSMS = async (phone, type, grams, amount, currency, txnId) => {
  const symbol = currency === 'INR' ? 'Rs.' : '$';
  const msg = `DigiGold: ${type} SUCCESSFUL! ${grams}g gold for ${symbol}${amount}. TxnID: ${txnId}. Your gold is safe with us!`;
  await sendSMS(phone, msg);
};

exports.sendWelcomeSMS = async (phone, name) => {
  const msg = `Welcome to DigiGold, ${name}! Your account is ready. Start investing in digital gold today. -DigiGold`;
  await sendSMS(phone, msg);
};
