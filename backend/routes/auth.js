const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const GoldSaving = require('../models/GoldSaving');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (id, role = 'user') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').isMobilePhone().withMessage('Valid phone number required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { fullName, email, phone, password, dateOfBirth, address, panNumber } = req.body;

      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        const field = existingUser.email === email ? 'Email' : 'Phone';
        return res.status(400).json({ success: false, message: `${field} already registered` });
      }

      const otp = generateOTP();
      const user = await User.create({
        fullName, email, phone, password,
        dateOfBirth: dateOfBirth || null,
        address: address || '',
        panNumber: panNumber || '',
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });

      await GoldSaving.create({ userId: user._id, planName: 'My Gold Savings' });

      await Promise.allSettled([
        emailService.sendOTPEmail(email, otp),
        smsService.sendOTPSMS(phone, otp),
      ]);

      res.status(201).json({
        success: true,
        message: 'OTP sent to your email and phone. Please verify.',
        userId: user._id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
);

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    await Promise.allSettled([
      emailService.sendWelcomeEmail(user.email, user.fullName),
      smsService.sendWelcomeSMS(user.phone, user.fullName),
    ]);

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Account verified successfully!', token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await Promise.allSettled([
      emailService.sendOTPEmail(user.email, otp),
      smsService.sendOTPSMS(user.phone, otp),
    ]);

    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account suspended' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await Promise.allSettled([
        emailService.sendOTPEmail(user.email, otp),
        smsService.sendOTPSMS(user.phone, otp),
      ]);
      return res.status(403).json({
        success: false,
        message: 'Account not verified. OTP sent.',
        requireVerification: true,
        userId: user._id,
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, message: 'Admin login successful', token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin login failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email not registered' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await Promise.allSettled([
      emailService.sendOTPEmail(email, otp),
      smsService.sendOTPSMS(user.phone, otp),
    ]);

    res.json({ success: true, message: 'OTP sent for password reset', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

module.exports = router;
