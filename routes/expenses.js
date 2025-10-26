const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth } = require('../middleware/auth');

// Get all expenses for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(20); // Limit to most recent 20 expenses
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expense summary (today, week, month)
router.get('/summary', auth, async (req, res) => {
  try {
    // Calculate today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate start of week (7 days ago)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    // Calculate start of month (30 days ago)
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);
    
    // Get today's expenses
    const todayExpenses = await Expense.find({
      user: req.user.id,
      date: { $gte: today }
    });
    
    // Get this week's expenses
    const weekExpenses = await Expense.find({
      user: req.user.id,
      date: { $gte: weekStart }
    });
    
    // Get this month's expenses
    const monthExpenses = await Expense.find({
      user: req.user.id,
      date: { $gte: monthStart }
    });
    
    // Calculate totals
    const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const weekTotal = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    res.json({
      todayTotal,
      weekTotal,
      monthTotal
    });
  } catch (err) {
    console.error('Error fetching expense summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new expense
router.post('/', auth, async (req, res) => {
  try {
    const { amount, description, date } = req.body;
    
    // Validate required fields
    if (!amount || !description) {
      return res.status(400).json({ message: 'Amount and description are required' });
    }
    
    console.log('Creating expense with user ID:', req.user ? req.user.id : 'No user ID');
    
    // Create new expense
    const newExpense = new Expense({
      amount: Number(amount),
      description,
      date: date || Date.now(),
      user: req.user ? req.user.id : null
    });
    
    // Save to database
    const expense = await newExpense.save();
    
    console.log('Expense created:', expense);
    res.status(201).json(expense);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete an expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    await Expense.deleteOne({ _id: req.params.id });
    
    res.json({ message: 'Expense removed' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;