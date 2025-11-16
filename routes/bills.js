const express = require('express');
const router = express.Router();
const BillGroup = require('../models/BillGroup');
const { auth } = require('../middleware/auth');

// List all bill groups for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const groups = await BillGroup.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Name and members are required' });
    }
    const group = new BillGroup({ user: req.user.id, name, members });
    const saved = await group.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a single group
router.get('/:id', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const group = await BillGroup.findOne({ _id: req.params.id, user: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add expense to a group
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { description, amount, whoPaid, splitBetween, date } = req.body;
    if (!description || !amount || !whoPaid || !Array.isArray(splitBetween) || splitBetween.length === 0) {
      return res.status(400).json({ message: 'Invalid expense payload' });
    }
    const group = await BillGroup.findOne({ _id: req.params.id, user: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.expenses.push({ description, amount, whoPaid, splitBetween, date });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add settlement to a group
router.post('/:id/settlements', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { from, to, amount, note, date } = req.body;
    if (!from || !to || !amount) {
      return res.status(400).json({ message: 'Invalid settlement payload' });
    }
    const group = await BillGroup.findOne({ _id: req.params.id, user: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    group.settlements.push({ from, to, amount, note, date });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a group
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.isAuthenticated) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const deleted = await BillGroup.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Group not found' });
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;