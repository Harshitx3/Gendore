// Home page functionality
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const todaySpending = document.getElementById('today-spending');
    const weekSpending = document.getElementById('week-spending');
    const debtBalance = document.getElementById('debt-balance');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    
    // Load initial data
    loadSummaryData();
    
    // Set up quick action buttons
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            switch(action) {
                case 'add-expense':
                    window.location.href = 'expense.html';
                    break;
                case 'add-planned':
                    window.location.href = 'planned.html';
                    break;
                case 'add-debt':
                    window.location.href = 'debt.html';
                    break;
            }
        });
    });
    
    // Functions
    async function loadSummaryData() {
        try {
            // Get today's spending
            const today = new Date().toISOString().split('T')[0];
            const todayData = await fetchAPI(`/expenses/total/day?date=${today}`);
            if (todayData && todayData.total !== undefined) {
                todaySpending.textContent = formatCurrency(todayData.total);
            }
            
            // Get week spending
            const weekData = await fetchAPI('/expenses/total/week');
            if (weekData && weekData.total !== undefined) {
                weekSpending.textContent = formatCurrency(weekData.total);
            }
            
            // Get debt balance
            const debtData = await fetchAPI('/debts/totals');
            if (debtData) {
                const balance = (debtData.theyOwe || 0) - (debtData.youOwe || 0);
                debtBalance.textContent = formatCurrency(balance);
                
                // Change color based on balance
                if (balance < 0) {
                    debtBalance.style.color = 'var(--danger-color)';
                } else if (balance > 0) {
                    debtBalance.style.color = 'var(--success-color)';
                }
            }
        } catch (error) {
            console.error('Error loading summary data:', error);
        }
    }
});