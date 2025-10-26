// Goal Planner Calculator JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const calculateBtn = document.getElementById('calculate-btn');
    const goalNameInput = document.getElementById('goal-name');
    const goalAmountInput = document.getElementById('goal-amount');
    const savingsAmountInput = document.getElementById('savings-amount');
    const savingsFrequencySelect = document.getElementById('savings-frequency');
    const resultSection = document.getElementById('result-section');
    const goalNameDisplay = document.getElementById('goal-name-display');
    const timeValue = document.getElementById('time-value');
    const timeUnit = document.getElementById('time-unit');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const motivationText = document.getElementById('motivation-text');
    const summaryAmount = document.getElementById('summary-amount');
    const summarySaving = document.getElementById('summary-saving');

    // Event Listeners
    calculateBtn.addEventListener('click', calculateGoal);

    // Functions
    function calculateGoal() {
        // Get input values
        const goalName = goalNameInput.value.trim();
        const goalAmount = parseFloat(goalAmountInput.value);
        const savingsAmount = parseFloat(savingsAmountInput.value);
        const savingsFrequency = savingsFrequencySelect.value;

        // Validate inputs
        if (!goalName || isNaN(goalAmount) || isNaN(savingsAmount) || 
            goalAmount <= 0 || savingsAmount <= 0) {
            alert('Please fill in all fields with valid values');
            return;
        }

        // Calculate time to reach goal
        let timeToReachGoal;
        if (savingsFrequency === 'weekly') {
            timeToReachGoal = goalAmount / savingsAmount; // in weeks
        } else {
            timeToReachGoal = goalAmount / savingsAmount; // in months
        }

        // Round up to nearest whole number
        timeToReachGoal = Math.ceil(timeToReachGoal);

        // Update UI
        updateResultUI(goalName, goalAmount, savingsAmount, savingsFrequency, timeToReachGoal);
    }

    function updateResultUI(goalName, goalAmount, savingsAmount, savingsFrequency, timeToReachGoal) {
        // Update goal name
        goalNameDisplay.textContent = goalName;

        // Update time
        timeValue.textContent = timeToReachGoal;
        timeUnit.textContent = savingsFrequency === 'weekly' ? 
            (timeToReachGoal === 1 ? 'week' : 'weeks') : 
            (timeToReachGoal === 1 ? 'month' : 'months');

        // Calculate progress percentage (assuming starting from 0)
        // For visualization purposes, we'll show a small percentage
        const progressPercent = 5;
        progressFill.style.width = `${progressPercent}%`;
        progressPercentage.textContent = `${progressPercent}%`;

        // Update motivation text based on time
        updateMotivationText(timeToReachGoal, savingsFrequency);

        // Update summary
        summaryAmount.textContent = formatCurrency(goalAmount);
        summarySaving.textContent = `${formatCurrency(savingsAmount)}/${savingsFrequency === 'weekly' ? 'week' : 'month'}`;

        // Show animation
        progressFill.style.animation = 'none';
        setTimeout(() => {
            progressFill.style.animation = 'fillProgress 1s ease forwards';
            progressFill.style.setProperty('--target-width', `${progressPercent}%`);
        }, 10);
    }

    function updateMotivationText(timeToReachGoal, frequency) {
        // Convert to months for comparison if weekly
        const timeInMonths = frequency === 'weekly' ? timeToReachGoal / 4 : timeToReachGoal;
        
        let message;
        
        if (timeInMonths <= 1) {
            message = "🚀 Almost there! You'll reach your goal super fast!";
        } else if (timeInMonths <= 3) {
            message = "💪 Nice! You're on a quick path to your goal!";
        } else if (timeInMonths <= 6) {
            message = "🔥 Keep that fire burning! You're making great progress!";
        } else if (timeInMonths <= 12) {
            message = "💸 Keep saving, legend! Your future self will thank you!";
        } else {
            message = "✨ Dream big! Consistent small steps lead to big achievements!";
        }
        
        motivationText.textContent = message;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
});