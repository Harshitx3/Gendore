const express = require('express');
const router = express.Router();
const Debt = require('../models/Debt');
const { auth } = require('../middleware/auth');

// Get all debts
router.get('/', auth, async (req, res) => {
  try {
    
    const debts = await Debt.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get debt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user.id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    res.json(debt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create debt
router.post('/', auth, async (req, res) => {
  try {
    
    const debt = new Debt({
      person: req.body.person,
      amount: req.body.amount,
      direction: req.body.direction,
      dueDate: req.body.dueDate,
      note: req.body.note,
      settled: req.body.settled || false,
      user: req.user.id
    });

    const newDebt = await debt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update debt
router.patch('/:id', auth, async (req, res) => {
  try {
    // The auth middleware already checks authentication
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user.id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    
    if (req.body.person) debt.person = req.body.person;
    if (req.body.amount) debt.amount = req.body.amount;
    if (req.body.direction) debt.direction = req.body.direction;
    if (req.body.dueDate !== undefined) debt.dueDate = req.body.dueDate;
    if (req.body.note !== undefined) debt.note = req.body.note;
    if (req.body.settled !== undefined) debt.settled = req.body.settled;
    
    const updatedDebt = await debt.save();
    res.json(updatedDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete debt
router.delete('/:id', auth, async (req, res) => {
  try {
    // The auth middleware already checks authentication
    const debt = await Debt.findOne({ _id: req.params.id, user: req.user.id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    
    await Debt.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Debt deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get debt totals
router.get('/totals/summary', auth, async (req, res) => {
  try {
    
    const debts = await Debt.find({ user: req.user.id, settled: false });
    
    let youOwe = 0;
    let theyOweYou = 0;
    
    debts.forEach(debt => {
      if (debt.direction === 'you_owe') {
        youOwe += debt.amount;
      } else {
        theyOweYou += debt.amount;
      }
    });
    
    res.json({
      youOwe,
      theyOweYou,
      balance: theyOweYou - youOwe,
      count: debts.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark debt as settled
router.patch('/:id/settle', auth, async (req, res) => {
  try {
    
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    
    debt.settled = true;
    const updatedDebt = await debt.save();
    
    res.json({
      message: 'Debt marked as settled',
      debt: updatedDebt
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;