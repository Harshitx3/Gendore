const express = require('express');
const router = express.Router();
const PlannedItem = require('../models/PlannedItem');
const auth = require('../middleware/auth');

// Get all planned items for the logged-in user
router.get('/all', auth, async (req, res) => {
  try {
    const plannedItems = await PlannedItem.find({ user: req.user.id }).sort({ expectedDate: 1 });
    return res.status(200).json(plannedItems || []);
  } catch (err) {
    console.error('Error fetching planned items:', err.message);
    return res.status(500).json({ error: 'Failed to fetch planned items' });
  }
});

// Get summary of planned items for today, tomorrow, and this week
router.get('/summary', auth, function(req, res) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Get today's planned items
  PlannedItem.find({
    user: req.user.id,
    expectedDate: {
      $gte: today,
      $lt: tomorrow
    }
  }).then(todayItems => {
    // Get tomorrow's planned items
    PlannedItem.find({
      user: req.user.id,
      expectedDate: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      }
    }).then(tomorrowItems => {
      // Get this week's planned items
      PlannedItem.find({
        user: req.user.id,
        expectedDate: {
          $gte: today,
          $lt: nextWeek
        }
      }).then(weekItems => {
        // Calculate totals
        const todayTotal = todayItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
        const tomorrowTotal = tomorrowItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
        const weekTotal = weekItems.reduce((sum, item) => sum + item.estimatedAmount, 0);
        
        res.json({
          today: todayTotal,
          tomorrow: tomorrowTotal,
          week: weekTotal
        });
      }).catch(err => res.status(500).json({ message: err.message }));
    }).catch(err => res.status(500).json({ message: err.message }));
  }).catch(err => res.status(500).json({ message: err.message }));
});

// Create planned item
router.post('/', auth, function(req, res) {
  const plannedItem = new PlannedItem({
    description: req.body.description,
    where: req.body.where,
    estimatedAmount: req.body.estimatedAmount,
    expectedDate: req.body.expectedDate || new Date(),
    completed: req.body.completed || false,
    user: req.user.id
  });

  plannedItem.save()
    .then(newPlannedItem => res.status(201).json(newPlannedItem))
    .catch(err => res.status(400).json({ message: err.message }));
});

// Update planned item
router.patch('/:id', auth, function(req, res) {
  PlannedItem.findOne({
    _id: req.params.id,
    user: req.user.id
  })
    .then(plannedItem => {
      if (!plannedItem) return res.status(404).json({ message: 'Planned item not found' });
      
      if (req.body.description) plannedItem.description = req.body.description;
      if (req.body.where !== undefined) plannedItem.where = req.body.where;
      if (req.body.estimatedAmount) plannedItem.estimatedAmount = req.body.estimatedAmount;
      if (req.body.expectedDate) plannedItem.expectedDate = req.body.expectedDate;
      if (req.body.completed !== undefined) plannedItem.completed = req.body.completed;
      
      return plannedItem.save();
    })
    .then(updatedPlannedItem => res.json(updatedPlannedItem))
    .catch(err => res.status(400).json({ message: err.message }));
});

// Delete planned item
router.delete('/:id', auth, function(req, res) {
  PlannedItem.findOne({ 
    _id: req.params.id,
    user: req.user.id
  })
    .then(plannedItem => {
      if (!plannedItem) return res.status(404).json({ message: 'Planned item not found' });
      
      return PlannedItem.deleteOne({ _id: req.params.id });
    })
    .then(() => res.json({ message: 'Planned item deleted' }))
    .catch(err => res.status(500).json({ message: err.message }));
});

// Convert planned item to expense
router.post('/:id/convert', auth, function(req, res) {
  let plannedItemData;
  
  PlannedItem.findOne({
    _id: req.params.id,
    user: req.user.id
  })
    .then(plannedItem => {
      if (!plannedItem) return res.status(404).json({ message: 'Planned item not found' });
      
      plannedItemData = plannedItem;
      
      // Create a new expense from the planned item
      const expense = new Expense({
        amount: plannedItem.estimatedAmount,
        category: 'Other',
        description: plannedItem.description,
        date: new Date(),
        note: `Converted from planned expense at ${plannedItem.where || 'unknown location'}`,
        user: req.user.id
      });
      
      return expense.save();
    })
    .then(() => {
      // Delete the planned item after conversion
      return PlannedItem.deleteOne({ _id: req.params.id });
    })
    .then(() => {
      res.json({ message: 'Planned item converted to expense successfully' });
    })
    .catch(err => {
      res.status(500).json({ message: err.message });
    });
}); 

module.exports = router;