const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName, address, dateOfBirth, panNumber, preferredCurrency, fcmToken } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (address) updates.address = address;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (panNumber) updates.panNumber = panNumber;
    if (preferredCurrency) updates.preferredCurrency = preferredCurrency;
    if (fcmToken) updates.fcmToken = fcmToken;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PUT /api/user/change-password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
});

module.exports = router;
