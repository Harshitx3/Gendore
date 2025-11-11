// DOM Elements
let expenseForm;
let amountInput;
let descriptionInput;
let dateInput;
let todayTotalElement;
let weekTotalElement;
let monthTotalElement;
let expenseList;
let addExpenseBtn;
let expenseModal;
let closeModalBtn;
let expenseFilter;

// Cache for API responses
const apiCache = {
    data: {},
    // Cache validity in milliseconds (15 seconds for faster updates)
    cacheValidity: 15000,
    
    // Get cached data if valid
    get: function(key) {
        const cachedItem = this.data[key];
        if (cachedItem && (Date.now() - cachedItem.timestamp < this.cacheValidity)) {
            console.log(`Using cached data for ${key}`);
            return cachedItem.data;
        }
        return null;
    },
    
    // Set data in cache
    set: function(key, data) {
        this.data[key] = {
            timestamp: Date.now(),
            data: data
        };
    },
    
    // Invalidate specific cache entry
    invalidate: function(key) {
        if (this.data[key]) {
            console.log(`Invalidating cache for ${key}`);
            delete this.data[key];
        }
    },
    
    // Invalidate all cache entries
    invalidateAll: function() {
        console.log('Invalidating all cache entries');
        this.data = {};
    },
    
    // Prefetch data to have it ready
    prefetch: function(key, fetchFunction) {
        setTimeout(() => {
            if (!this.get(key)) {
                console.log(`Prefetching ${key}`);
                fetchFunction().then(data => this.set(key, data));
            }
        }, 100);
    }
};

// Data storage
let expenses = [];
let totals = {
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0
};

// Get auth headers for API requests
function getAuthHeaders() {
    const token = getTokenOrRedirect();
    console.log('Using token for request:', token);
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || ''
    };
}

// Fetch expenses from API with caching
async function fetchExpenses() {
    // Check if we have cached data
    const cachedData = apiCache.get('expenses');
    if (cachedData) {
        expenses = cachedData;
        return cachedData;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('/api/expenses', {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal,
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            logoutUser();
            return [];
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        expenses = await response.json();
        
        // Cache the response
        apiCache.set('expenses', expenses);
        
        return expenses;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Fetch expenses request timed out');
        } else {
            console.error('Error fetching expenses:', error);
        }
        return apiCache.get('expenses') || [];
    }
}

// Fetch expense summary from API with caching
async function fetchExpenseSummary() {
    // Check if we have cached data
    const cachedData = apiCache.get('summary');
    if (cachedData) {
        totals = cachedData;
        return cachedData;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('/api/expenses/summary', {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal,
            cache: 'no-store' // Force fresh data
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            logoutUser();
            return { todayTotal: 0, weekTotal: 0, monthTotal: 0 };
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        totals = await response.json();
        
        // Cache the response
        apiCache.set('summary', totals);
        
        return totals;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Fetch summary request timed out');
        } else {
            console.error('Error fetching expense summary:', error);
        }
        return apiCache.get('summary') || { todayTotal: 0, weekTotal: 0, monthTotal: 0 };
    }
}

// Show loading indicators
function showLoadingIndicators() {
    // Add loading class to summary cards
    document.querySelectorAll('.summary-card').forEach(card => {
        card.classList.add('loading');
    });
    
    // Add loading overlay to expense list
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    expenseList.appendChild(loadingOverlay);
}

// Hide loading indicators
function hideLoadingIndicators() {
    // Remove loading class from summary cards
    document.querySelectorAll('.summary-card').forEach(card => {
        card.classList.remove('loading');
    });
    
    // Remove loading overlay from expense list
    const loadingOverlay = expenseList.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * Display skeleton content for better perceived performance
 */
function displaySkeletonContent() {
    // Add skeleton content to expense list
    if (expenseList.children.length === 0) {
        for (let i = 0; i < 3; i++) {
            const skeletonItem = document.createElement('div');
            skeletonItem.className = 'expense-item skeleton';
            skeletonItem.innerHTML = `
                <div class="expense-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-text"></div>
                </div>
                <div class="expense-right">
                    <div class="skeleton-line skeleton-amount"></div>
                </div>
            `;
            expenseList.appendChild(skeletonItem);
        }
    }
}

/**
 * Hide skeleton content
 */
function hideSkeletonContent() {
    // Remove skeleton items
    document.querySelectorAll('.skeleton').forEach(item => {
        item.remove();
    });
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    if (!requireAuth()) {
        return; // Stop execution if not authenticated
    }
    
    // Initialize DOM elements
    expenseForm = document.getElementById('expense-form');
    amountInput = document.getElementById('expense-amount');
    descriptionInput = document.getElementById('expense-description');
    dateInput = document.getElementById('expense-date');
    
    // Ensure amountInput is properly initialized
    if (!amountInput) {
        console.error('Amount input element not found');
    }
    todayTotalElement = document.getElementById('todayTotal');
    weekTotalElement = document.getElementById('weekTotal');
    monthTotalElement = document.getElementById('monthTotal');
    expenseList = document.getElementById('expense-list');
    addExpenseBtn = document.getElementById('add-expense-btn');
    expenseModal = document.getElementById('expense-modal');
    closeModalBtn = document.querySelector('.close');
    expenseFilter = document.getElementById('expense-filter');

    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;

    // Add event listeners
    expenseForm.addEventListener('submit', handleExpenseFormSubmit);
    addExpenseBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    expenseFilter.addEventListener('change', handleFilterChange);
    window.addEventListener('click', function(event) {
        if (event.target === expenseModal) {
            closeModal();
        }
    });
    
    // Prefetch data for faster subsequent loads
    setTimeout(() => {
        apiCache.prefetch('expenses', fetchExpenses);
        apiCache.prefetch('summary', fetchExpenseSummary);
    }, 5000);
    
    // Load expense summary and expense list from API in parallel
    showLoadingIndicators();
    
    // Show skeleton content immediately for better perceived performance
    displaySkeletonContent();
    
    Promise.all([loadExpenseSummary(), loadExpenses()])
        .finally(() => {
            hideLoadingIndicators();
            hideSkeletonContent();
        });
});

/**
 * Open the expense modal
 */
function openModal() {
    expenseModal.style.display = 'block';
}

/**
 * Close the expense modal
 */
function closeModal() {
    expenseModal.style.display = 'none';
}

/**
 * Handle expense form submission
 * @param {Event} event - Form submit event
 */
async function handleExpenseFormSubmit(event) {
    event.preventDefault();
    
    // Validate form
    if (!expenseForm.checkValidity()) {
        return;
    }

    // Get form values and ensure they're valid
    if (!amountInput || !amountInput.value) {
        console.error('Amount input is missing or empty');
        alert('Please enter a valid amount');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount');
        return;
    }
    
    const description = descriptionInput.value.trim();
    if (!description) {
        alert('Please enter a description');
        return;
    }
    
    const date = dateInput.value;

    // Create expense object
    const newExpense = {
        amount,
        description,
        date
    };
    
    try {
        console.log('Sending expense data:', newExpense);
        
        // Send to API
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newExpense)
        });
        
        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            logoutUser();
            return;
        }
        const responseData = await response.json();
        
        if (!response.ok) {
            console.error('Server response:', responseData);
            throw new Error(responseData.message || 'Failed to create expense');
        }
        
        console.log('Expense created successfully:', responseData);
        
        // Invalidate cache to force fresh data on next load
        apiCache.lastFetchTime = 0;
        
        // Show loading indicators
        showLoadingIndicators();
        
        // Refresh UI with parallel API calls for better performance
        Promise.all([loadExpenseSummary(), loadExpenses()])
            .finally(() => hideLoadingIndicators());
        
        // Reset form and close modal
        expenseForm.reset();
        closeModal();
        
        // Set default date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateInput.value = formattedDate;
    } catch (error) {
        console.error('Error creating expense:', error);
        alert('Failed to create expense. Please try again.');
    }
}

/**
 * Save expense to MongoDB via API
 * @param {Object} expense - Expense object
 * @deprecated Use handleExpenseFormSubmit instead
 */
// This function is deprecated and no longer used
    /*
    fetch('/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(expense)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save expense');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        expenseForm.reset();
        
        // Set default date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        dateInput.value = formattedDate;

        // Close modal
        closeModal();

        // Reload expense summary and expense list
        loadExpenseSummary();
        loadExpenses();
    })
    .catch(error => {
        console.error('Error saving expense:', error);
        alert('Failed to save expense. Please try again.');
    })
    */
    /* 
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
    */


/**
 * Load expense summary from MongoDB via API
 */
async function loadExpenseSummary() {
    try {
        const summary = await fetchExpenseSummary();
        
        // Update UI with summary data
        if (summary && typeof summary.todayTotal !== 'undefined') {
            todayTotalElement.textContent = formatCurrency(summary.todayTotal);
            weekTotalElement.textContent = formatCurrency(summary.weekTotal);
            monthTotalElement.textContent = formatCurrency(summary.monthTotal);
            
            // Highlight today's total with animation if it's greater than 0
            if (summary.todayTotal > 0) {
                todayTotalElement.parentElement.classList.add('highlight');
                setTimeout(() => {
                    todayTotalElement.parentElement.classList.remove('highlight');
                }, 1500);
            }
        } else {
            console.error('Invalid summary data:', summary);
            todayTotalElement.textContent = formatCurrency(0);
            weekTotalElement.textContent = formatCurrency(0);
            monthTotalElement.textContent = formatCurrency(0);
        }
    } catch (error) {
        console.error('Error loading expense summary:', error);
        // Set default values if there's an error
        todayTotalElement.textContent = formatCurrency(0);
        weekTotalElement.textContent = formatCurrency(0);
        monthTotalElement.textContent = formatCurrency(0);
    }
}

/**
 * Handle filter change event
 */
function handleFilterChange() {
    const filterValue = expenseFilter.value;
    console.log('Filter changed to:', filterValue);
    loadExpenses(filterValue);
}

/**
 * Load expenses from MongoDB via API
 * @param {string} filter - Filter option (all, today, week, month)
 */
async function loadExpenses(filter = 'all') {
    // Clear expense list except for empty state message
    const emptyState = expenseList.querySelector('.empty-state');
    expenseList.innerHTML = '';
    expenseList.appendChild(emptyState);
    
    try {
        // Fetch expenses from API
        const expenses = await fetchExpenses();
        console.log('Loaded expenses:', expenses);
        
        // Filter expenses based on selected filter
        let filteredExpenses = expenses;
        
        if (filter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            weekStart.setHours(0, 0, 0, 0);
            
            const monthStart = new Date();
            monthStart.setDate(monthStart.getDate() - 30);
            monthStart.setHours(0, 0, 0, 0);
            
            filteredExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                
                if (filter === 'today') {
                    return expenseDate >= today;
                } else if (filter === 'week') {
                    return expenseDate >= weekStart;
                } else if (filter === 'month') {
                    return expenseDate >= monthStart;
                }
                
                return true;
            });
        }
        
        // Show or hide empty state based on filtered expenses
        emptyState.style.display = filteredExpenses.length === 0 ? 'block' : 'none';
        
        // Create expense items from filtered data
        filteredExpenses.forEach(expense => {
            const expenseItem = createExpenseItem(expense);
            expenseList.appendChild(expenseItem);
        });
    } catch (error) {
        console.error('Error loading expenses:', error);
        emptyState.style.display = 'block';
    }
}

/**
 * Create expense item element
 * @param {Object} expense - Expense object
 * @returns {HTMLElement} Expense item element
 */
function createExpenseItem(expense) {
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.dataset.id = expense._id || expense.id || Date.now().toString();
    
    // Set category-based border color
    const categoryColors = {
        'food': '#FF9800',
        'transportation': '#2196F3',
        'entertainment': '#9C27B0',
        'shopping': '#F44336',
        'bills': '#4CAF50',
        'health': '#00BCD4',
        'education': '#3F51B5',
        'other': '#7C4DFF'
    };
    
    // Get category from expense or default to 'other'
    const category = (expense.category || 'other').toLowerCase();
    const borderColor = categoryColors[category] || categoryColors.other;
    expenseItem.style.borderLeftColor = borderColor;
    
    // Add animation class for new items
    expenseItem.classList.add('new-item');
    setTimeout(() => {
        expenseItem.classList.remove('new-item');
    }, 500);
    
    // Left side - expense info
    const expenseInfo = document.createElement('div');
    expenseInfo.className = 'expense-info';
    
    const expenseDescription = document.createElement('div');
    expenseDescription.className = 'expense-description';
    expenseDescription.textContent = expense.description;
    
    const expenseDate = document.createElement('div');
    expenseDate.className = 'expense-date';
    expenseDate.textContent = formatDate(expense.date);
    
    // Add category badge if available
    if (expense.category) {
        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'category-badge';
        categoryBadge.textContent = expense.category;
        categoryBadge.style.backgroundColor = borderColor + '22'; // Add transparency
        categoryBadge.style.color = borderColor;
        expenseInfo.appendChild(categoryBadge);
    }
    
    expenseInfo.appendChild(expenseDescription);
    expenseInfo.appendChild(expenseDate);
    
    // Right side - amount and actions
    const expenseRight = document.createElement('div');
    expenseRight.className = 'expense-right';
    
    const expenseAmount = document.createElement('div');
    expenseAmount.className = 'expense-amount';
    expenseAmount.textContent = formatCurrency(expense.amount);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete expense';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteExpense(expense._id || expense.id);
    });
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit expense';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // If you have an edit function, call it here
        // editExpense(expense._id || expense.id);
    });
    
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.appendChild(editBtn);
    actionButtons.appendChild(deleteBtn);
    
    expenseRight.appendChild(expenseAmount);
    expenseRight.appendChild(actionButtons);
    
    // Add all elements to expense item
    expenseItem.appendChild(expenseInfo);
    expenseItem.appendChild(expenseRight);
    
    return expenseItem;
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

/**
 * Format date
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Delete an expense
 * @param {string} expenseId - ID of the expense to delete
 */
async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        // Show visual feedback immediately
        const expenseElement = document.querySelector(`[data-id="${expenseId}"]`);
        if (expenseElement) {
            expenseElement.classList.add('deleting');
            expenseElement.style.opacity = '0.5';
            expenseElement.style.pointerEvents = 'none';
        }
        
        // Add loading animation
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'delete-spinner';
        if (expenseElement) {
            expenseElement.appendChild(loadingSpinner);
        }
        
        console.log(`Deleting expense with ID: ${expenseId}`);
        
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Failed to delete expense (Status: ${response.status})`);
        }
        
        console.log('Delete successful, removing from UI');
        
        // Success animation before removing
        if (expenseElement) {
            expenseElement.classList.add('deleted');
            // Remove the element after animation completes
            setTimeout(() => {
                expenseElement.remove();
                // Show empty state if no expenses left
                if (expenseList.querySelectorAll('.expense-item').length === 0) {
                    const emptyState = expenseList.querySelector('.empty-state');
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                }
            }, 300);
        }
        
        // Invalidate cache to force fresh data on next load
        apiCache.invalidateAll();
        
        // Refresh summary data only (no need to reload all expenses)
        loadExpenseSummary();
        
        // Show success notification
        showNotification('Expense deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Failed to delete expense. Please try again.', 'error');
        
        // Restore UI if delete failed
        const expenseElement = document.querySelector(`[data-id="${expenseId}"]`);
        if (expenseElement) {
            expenseElement.classList.remove('deleting');
            expenseElement.style.opacity = '1';
            expenseElement.style.pointerEvents = 'auto';
            const spinner = expenseElement.querySelector('.delete-spinner');
            if (spinner) spinner.remove();
        }
    }
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Update mock totals based on expenses
 * @deprecated No longer used - expense totals are now fetched from the API
 */
// This function is deprecated and no longer used