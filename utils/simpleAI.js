const Expense = require('../models/Expense');

/**
 * SimpleAI - A natural language processor for GenZ Money Planner
 * Understands Indian GenZ style expense inputs and converts them to structured data
 */
const simpleAI = {
  /**
   * Process natural language input and extract expense details
   * @param {string} input - User's natural language input
   * @param {string} userId - User ID for storing the expense
   * @returns {Object} Extracted expense data or error
   */
  processExpense: async (input, userId) => {
    try {
      // Convert to lowercase for easier processing
      const text = input.toLowerCase();
      
      // Extract amount using regex - looks for numbers with optional ₹ symbol
      const amountRegex = /(?:₹|rs\.?|rupees?|spent|paid|for|costs?|price|rs|inr)?\s*(\d+)/i;
      const amountMatch = text.match(amountRegex);
      
      if (!amountMatch) {
        return { success: false, message: "Couldn't find an amount in your message. Try something like 'Spent ₹100 on food'" };
      }
      
      const amount = parseInt(amountMatch[1]);
      
      // Extract category using common keywords
      let category = 'Other';
      
      // Common Indian GenZ expense categories with keywords
      const categories = {
        'Food': ['food', 'lunch', 'dinner', 'breakfast', 'snacks', 'pizza', 'burger', 'biryani', 'dosa', 'chai', 'coffee', 'zomato', 'swiggy', 'restaurant', 'cafe', 'dhaba'],
        'Transport': ['uber', 'ola', 'auto', 'rickshaw', 'cab', 'taxi', 'metro', 'bus', 'train', 'petrol', 'diesel', 'fuel', 'travel', 'transport'],
        'Shopping': ['shopping', 'clothes', 'shoes', 'tshirt', 'jeans', 'dress', 'myntra', 'amazon', 'flipkart', 'mall', 'store', 'market'],
        'Entertainment': ['movie', 'netflix', 'prime', 'hotstar', 'disney+', 'subscription', 'theatre', 'concert', 'game', 'pubg', 'bgmi', 'playstation', 'xbox'],
        'Education': ['college', 'school', 'tuition', 'course', 'class', 'book', 'stationery', 'fees', 'udemy', 'coursera'],
        'Bills': ['bill', 'rent', 'electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'recharge', 'mobile', 'phone', 'jio', 'airtel', 'vi'],
        'Health': ['medicine', 'doctor', 'hospital', 'medical', 'health', 'gym', 'fitness', 'yoga']
      };
      
      // Find category based on keywords
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          category = cat;
          break;
        }
      }
      
      // Extract description - use the text after the amount
      let description = text;
      if (amountMatch.index > 0) {
        // Get text after the amount
        const afterAmount = text.substring(amountMatch.index + amountMatch[0].length).trim();
        if (afterAmount) {
          // Clean up the description
          description = afterAmount.replace(/^(on|for|at)\s+/i, '');
        } else {
          // Get text before the amount
          description = text.substring(0, amountMatch.index).trim();
          description = description.replace(/^(spent|paid|bought|purchased)\s+/i, '');
        }
      }
      
      // Capitalize first letter of description
      description = description.charAt(0).toUpperCase() + description.slice(1);
      
      // If description is too short or empty, generate a generic one
      if (description.length < 3) {
        description = `${category} expense`;
      }
      
      // Create and save the expense
      const expense = new Expense({
        amount,
        description,
        category,
        user: userId,
        date: new Date()
      });
      
      await expense.save();
      
      return {
        success: true,
        expense: {
          amount,
          description,
          category,
          date: new Date()
        },
        message: `Added ₹${amount} for ${description} in ${category} category! 💸`
      };
    } catch (error) {
      console.error('SimpleAI error:', error);
      return { 
        success: false, 
        message: "Oops! Something went wrong. Try again with a clearer message like 'Spent ₹100 on food'" 
      };
    }
  },
  
  /**
   * Generate a response in Indian GenZ style
   * @param {Object} result - The result from processExpense
   * @returns {string} A GenZ style response
   */
  generateResponse: (result) => {
    if (!result.success) {
      return result.message;
    }
    
    const { amount, category } = result.expense;
    
    // Array of GenZ style responses
    const responses = [
      `Noted that! ₹${amount} added to ${category}. Paisa vasool! 💯`,
      `Done! ₹${amount} for ${category} added. Ab budget tight ho gaya! 💸`,
      `Got it! ₹${amount} spent on ${category}. Kharcha ho gaya track! 🚀`,
      `Expense added: ₹${amount} for ${category}. Saving game strong! 💪`,
      `₹${amount} tracked for ${category}. Budget on point! 👌`,
      `Added ₹${amount} to ${category}. Hisaab kitaab done! ✅`,
      `Expense of ₹${amount} noted. ${category} mein add kar diya! 🙌`,
      `₹${amount} spent on ${category}. Sorted hai boss! 😎`
    ];
    
    // Return a random response
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

module.exports = simpleAI;