const express = require('express');
const router = express.Router();
const simpleAI = require('../utils/simpleAI');
const { auth } = require('../middleware/auth');

// Parse natural language input
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text input is required' });
    }
    
    // Use the simpleAI module to process the expense
    const result = await simpleAI.processExpense(text, req.user.id);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    // Generate GenZ style response
    const response = simpleAI.generateResponse(result);
    
    // Return the result with the GenZ response
    res.json({
      success: true,
      expense: result.expense,
      message: response
    });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;