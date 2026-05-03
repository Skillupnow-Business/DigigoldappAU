const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GoldSaving = require('../models/GoldSaving');
const goldPriceService = require('../services/goldPriceService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const moment = require('moment');

// GET /api/gold/price
router.get('/price', async (req, res) => {
  try {
    const prices = await goldPriceService.getGoldPrices();
    res.json({ success: true, data: prices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gold price' });
  }
});

// POST /api/gold/buy
router.post('/buy', auth, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
    if (!['INR', 'USD'].includes(currency)) return res.status(400).json({ success: false, message: 'Currency must be INR or USD' });

    const prices = await goldPriceService.getGoldPrices();
    const pricePerGram = currency === 'INR' ? prices.goldInrPerGram : prices.goldUsdPerGram;
    const goldGrams = parseFloat((amount / pricePerGram).toFixed(6));

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'BUY',
      currency,
      amountPaid: amount,
      goldGrams,
      goldPricePerGram: pricePerGram,
      goldPricePerGramINR: prices.goldInrPerGram,
      goldPricePerGramUSD: prices.goldUsdPerGram,
      usdToInrRate: prices.usdToInr,
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          totalGoldGrams: goldGrams,
          totalInvestedINR: currency === 'INR' ? amount : amount * prices.usdToInr,
          totalInvestedUSD: currency === 'USD' ? amount : amount / prices.usdToInr,
        },
      },
      { new: true }
    );

    await GoldSaving.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: {
          savedGrams: goldGrams,
          savedAmountINR: currency === 'INR' ? amount : amount * prices.usdToInr,
          savedAmountUSD: currency === 'USD' ? amount : amount / prices.usdToInr,
        },
        $push: { transactions: transaction._id },
      }
    );

    const details = {
      transactionId: transaction.transactionId,
      goldGrams: goldGrams.toFixed(4),
      amountPaid: amount,
      currency,
      pricePerGram: pricePerGram.toFixed(2),
      totalGold: user.totalGoldGrams.toFixed(4),
      date: moment().format('DD MMM YYYY, hh:mm A'),
    };

    await Promise.allSettled([
      emailService.sendTransactionEmail(user.email, user.fullName, 'BUY', details),
      smsService.sendTransactionSMS(user.phone, 'BUY', details.goldGrams, amount, currency, transaction.transactionId),
    ]);

    res.json({
      success: true,
      message: `Successfully purchased ${goldGrams.toFixed(4)}g of gold!`,
      transaction,
      goldGrams,
      currentBalance: user.totalGoldGrams,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Purchase failed' });
  }
});

// POST /api/gold/sell
router.post('/sell', auth, async (req, res) => {
  try {
    const { grams, currency } = req.body;
    if (!grams || grams <= 0) return res.status(400).json({ success: false, message: 'Invalid grams' });

    const user = await User.findById(req.user._id);
    if (user.totalGoldGrams < grams) {
      return res.status(400).json({ success: false, message: 'Insufficient gold balance' });
    }

    const prices = await goldPriceService.getGoldPrices();
    const pricePerGram = currency === 'INR' ? prices.goldInrPerGram : prices.goldUsdPerGram;
    const amountReceived = parseFloat((grams * pricePerGram).toFixed(2));

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'SELL',
      currency,
      amountPaid: amountReceived,
      goldGrams: grams,
      goldPricePerGram: pricePerGram,
      goldPricePerGramINR: prices.goldInrPerGram,
      goldPricePerGramUSD: prices.goldUsdPerGram,
      usdToInrRate: prices.usdToInr,
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { totalGoldGrams: -grams } },
      { new: true }
    );

    await GoldSaving.findOneAndUpdate(
      { userId: req.user._id },
      {
        $inc: { savedGrams: -grams },
        $push: { transactions: transaction._id },
      }
    );

    const details = {
      transactionId: transaction.transactionId,
      goldGrams: parseFloat(grams).toFixed(4),
      amountPaid: amountReceived,
      currency,
      pricePerGram: pricePerGram.toFixed(2),
      totalGold: updatedUser.totalGoldGrams.toFixed(4),
      date: moment().format('DD MMM YYYY, hh:mm A'),
    };

    await Promise.allSettled([
      emailService.sendTransactionEmail(user.email, user.fullName, 'SELL', details),
      smsService.sendTransactionSMS(user.phone, 'SELL', details.goldGrams, amountReceived, currency, transaction.transactionId),
    ]);

    res.json({
      success: true,
      message: `Successfully sold ${grams}g of gold for ${currency === 'INR' ? '₹' : '$'}${amountReceived}`,
      transaction,
      amountReceived,
      currentBalance: updatedUser.totalGoldGrams,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Sell failed' });
  }
});

// GET /api/gold/transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// GET /api/gold/portfolio
router.get('/portfolio', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const prices = await goldPriceService.getGoldPrices();
    const saving = await GoldSaving.findOne({ userId: req.user._id });

    const currentValueINR = parseFloat((user.totalGoldGrams * prices.goldInrPerGram).toFixed(2));
    const currentValueUSD = parseFloat((user.totalGoldGrams * prices.goldUsdPerGram).toFixed(2));
    const profitINR = parseFloat((currentValueINR - user.totalInvestedINR).toFixed(2));
    const profitUSD = parseFloat((currentValueUSD - user.totalInvestedUSD).toFixed(2));

    res.json({
      success: true,
      data: {
        totalGoldGrams: user.totalGoldGrams,
        totalInvestedINR: user.totalInvestedINR,
        totalInvestedUSD: user.totalInvestedUSD,
        currentValueINR,
        currentValueUSD,
        profitINR,
        profitUSD,
        profitPercent: user.totalInvestedINR > 0
          ? parseFloat(((profitINR / user.totalInvestedINR) * 100).toFixed(2))
          : 0,
        goldPrice: prices,
        saving,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
});

module.exports = router;
