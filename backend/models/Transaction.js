const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['BUY', 'SELL', 'WITHDRAW'], required: true },
    currency: { type: String, enum: ['INR', 'USD'], required: true },
    amountPaid: { type: Number, required: true },
    goldGrams: { type: Number, required: true },
    goldPricePerGram: { type: Number, required: true },
    goldPricePerGramINR: { type: Number },
    goldPricePerGramUSD: { type: Number },
    usdToInrRate: { type: Number },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' },
    transactionId: { type: String, unique: true },
    paymentMethod: { type: String, default: 'WALLET' },
    notes: { type: String },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

transactionSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
