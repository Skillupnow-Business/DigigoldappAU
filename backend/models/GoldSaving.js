const mongoose = require('mongoose');

const goldSavingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planName: { type: String, default: 'My Gold Savings' },
    targetGrams: { type: Number },
    targetAmount: { type: Number },
    targetCurrency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    savedGrams: { type: Number, default: 0 },
    savedAmountINR: { type: Number, default: 0 },
    savedAmountUSD: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('GoldSaving', goldSavingSchema);
