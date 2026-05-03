const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const goldEmailTemplate = (userName, type, details) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #C9A84C, #8B6914); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: #f5e6c8; margin: 5px 0 0; }
    .body { padding: 30px; }
    .amount-box { background: linear-gradient(135deg, #1A1A2E, #16213E); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .amount-box .label { color: #C9A84C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .amount-box .value { color: white; font-size: 32px; font-weight: bold; margin: 8px 0; }
    .details { background: #f9f4e8; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8d9b5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #333; font-weight: bold; font-size: 14px; }
    .footer { background: #1A1A2E; padding: 20px; text-align: center; color: #888; font-size: 12px; }
    .gold-icon { font-size: 48px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="gold-icon">🪙</div>
      <h1>DigiGold</h1>
      <p>Your Digital Gold Investment</p>
    </div>
    <div class="body">
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Your gold ${type.toLowerCase()} transaction was <strong style="color:#27ae60">successful!</strong></p>
      <div class="amount-box">
        <div class="label">Gold ${type}</div>
        <div class="value">${details.goldGrams} grams</div>
        <div style="color:#C9A84C; font-size:16px;">= ${details.currency === 'INR' ? '₹' : '$'}${details.amountPaid.toLocaleString()}</div>
      </div>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">${details.transactionId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Gold Price</span>
          <span class="detail-value">${details.currency === 'INR' ? '₹' : '$'}${details.pricePerGram}/gram</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">${details.currency === 'INR' ? '₹' : '$'}${details.amountPaid.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${details.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Gold Held</span>
          <span class="detail-value">${details.totalGold} grams</span>
        </div>
      </div>
      <p style="color:#666; font-size:14px;">Your gold is stored securely. Thank you for investing with DigiGold!</p>
    </div>
    <div class="footer">
      <p>DigiGold &copy; 2024. All rights reserved.</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

const otpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:400px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#C9A84C,#8B6914);padding:30px;text-align:center;">
      <h1 style="color:white;margin:0;">DigiGold</h1>
      <p style="color:#f5e6c8;margin:5px 0 0;">OTP Verification</p>
    </div>
    <div style="padding:30px;text-align:center;">
      <p style="color:#333;font-size:16px;">Your OTP code is:</p>
      <div style="background:#1A1A2E;color:#C9A84C;font-size:40px;font-weight:bold;letter-spacing:12px;padding:20px;border-radius:8px;margin:20px 0;">${otp}</div>
      <p style="color:#666;font-size:14px;">This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color:#999;font-size:12px;">Never share this OTP with anyone.</p>
    </div>
  </div>
</body>
</html>
`;

exports.sendTransactionEmail = async (to, userName, type, details) => {
  try {
    await transporter.sendMail({
      from: `"DigiGold" <${process.env.EMAIL_USER}>`,
      to,
      subject: `DigiGold - Gold ${type} Successful! 🪙 ${details.goldGrams}g`,
      html: goldEmailTemplate(userName, type, details),
    });
    console.log(`Transaction email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: `"DigiGold" <${process.env.EMAIL_USER}>`,
      to,
      subject: `DigiGold - OTP: ${otp} (Expires in 10 min)`,
      html: otpEmailTemplate(otp),
    });
    console.log(`OTP email sent to ${to}`);
  } catch (err) {
    console.error('OTP email error:', err.message);
  }
};

exports.sendWelcomeEmail = async (to, userName) => {
  try {
    await transporter.sendMail({
      from: `"DigiGold" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Welcome to DigiGold, ${userName}! 🪙`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#C9A84C,#8B6914);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;">Welcome to DigiGold! 🪙</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <p>Dear <strong>${userName}</strong>,</p>
            <p>Welcome! Your DigiGold account is ready. Start investing in digital gold today in INR or USD.</p>
            <ul>
              <li>Buy gold starting from ₹1</li>
              <li>Real-time gold prices</li>
              <li>100% secure storage</li>
              <li>Invest in INR or USD</li>
            </ul>
            <p style="color:#888;font-size:12px;">DigiGold &copy; 2024</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Welcome email error:', err.message);
  }
};
