const asyncHandler = require('express-async-handler');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

// Utility to get or create wallet
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

// @desc    Get current wallet balance
// @route   GET /api/wallet
// @access  Private
const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);

  res.status(200).json({
    success: true,
    data: wallet,
  });
});

// @desc    Deposit funds into wallet
// @route   POST /api/wallet/deposit
// @access  Private
const deposit = asyncHandler(async (req, res) => {
  let { amount, description } = req.body;
  amount = parseFloat(amount);

  if (isNaN(amount) || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid deposit amount greater than 0.');
  }

  const wallet = await getOrCreateWallet(req.user._id);

  // Update balance
  wallet.balance += amount;
  await wallet.save();

  // Create transaction record
  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    type: 'deposit',
    amount,
    description: description || 'Deposit added to wallet',
    status: 'completed',
  });

  res.status(200).json({
    success: true,
    message: 'Deposit successful.',
    wallet,
    transaction,
  });
});

// @desc    Withdraw funds from wallet
// @route   POST /api/wallet/withdraw
// @access  Private
const withdraw = asyncHandler(async (req, res) => {
  let { amount, description } = req.body;
  amount = parseFloat(amount);

  if (isNaN(amount) || amount <= 0) {
    res.status(400);
    throw new Error('Please provide a valid withdrawal amount greater than 0.');
  }

  const wallet = await getOrCreateWallet(req.user._id);

  if (wallet.balance < amount) {
    res.status(400);
    throw new Error('Insufficient wallet balance for this withdrawal.');
  }

  // Update balance
  wallet.balance -= amount;
  await wallet.save();

  // Create transaction record
  const transaction = await WalletTransaction.create({
    wallet: wallet._id,
    type: 'withdraw',
    amount,
    description: description || 'Withdrawal from wallet',
    status: 'completed',
  });

  res.status(200).json({
    success: true,
    message: 'Withdrawal successful.',
    wallet,
    transaction,
  });
});

module.exports = {
  getWalletBalance,
  deposit,
  withdraw,
};
