const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GoldSaving = require('../models/GoldSaving');
const goldPriceService = require('../services/goldPriceService');

// GET /api/admin/dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      buyTransactions,
      sellTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ type: 'BUY' }),
      Transaction.countDocuments({ type: 'SELL' }),
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { type: 'BUY', currency: 'INR' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]);

    const totalGoldAgg = await User.aggregate([
      { $group: { _id: null, totalGold: { $sum: '$totalGoldGrams' } } },
    ]);

    const recentTransactions = await Transaction.find()
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    const prices = await goldPriceService.getGoldPrices();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, type: 'BUY' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalINR: {
            $sum: { $cond: [{ $eq: ['$currency', 'INR'] }, '$amountPaid', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalTransactions,
          buyTransactions,
          sellTransactions,
          totalRevenueINR: revenueAgg[0]?.total || 0,
          totalGoldGrams: totalGoldAgg[0]?.totalGold || 0,
        },
        goldPrice: prices,
        recentTransactions,
        recentUsers,
        dailyStats,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Dashboard fetch failed' });
  }
});

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const transactions = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(20);
    const saving = await GoldSaving.findOne({ userId: req.params.id });

    res.json({ success: true, data: { user, transactions, saving } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// PUT /api/admin/users/:id/toggle-status
router.put('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Status toggle failed' });
  }
});

// GET /api/admin/transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    const query = type ? { type } : {};
    const transactions = await Transaction.find(query)
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

module.exports = router;
