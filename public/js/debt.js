// Store debts in memory after fetching from MongoDB
let debts = [];

// Function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    if (error.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = 'login.html';
    }
    return null;
}

// Function to get current user ID
function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

document.addEventListener('DOMContentLoaded', () => {
    // Check for authentication using auth.js
    if (!requireAuth()) {
        return; // Stop execution if not authenticated
    }
    
    // DOM Elements
    const debtList = document.getElementById('debt-list');
    const addDebtBtn = document.getElementById('add-debt-btn');
    const debtModal = document.getElementById('debt-modal');
    const closeBtn = debtModal.querySelector('.close');
    const debtForm = document.getElementById('debt-form');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // Summary elements
    const youOweTotal = document.getElementById('you-owe-total');
    const theyOweTotal = document.getElementById('they-owe-total');
    const debtBalance = document.getElementById('debt-balance');
    
    // Store debts in memory
    let activeTab = 'all';
    
    // Open modal when add button is clicked
    addDebtBtn.addEventListener('click', () => {
        debtModal.style.display = 'block';
    });
    
    // Close modal when X is clicked
    closeBtn.addEventListener('click', () => {
        debtModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === debtModal) {
            debtModal.style.display = 'none';
        }
    });
    
    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update active tab
            activeTab = btn.dataset.tab;
            
            // Reload debts with new filter
            loadDebts();
        });
    });
    
    // Handle form submission
    debtForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const person = document.getElementById('debt-person').value;
        const amount = parseFloat(document.getElementById('debt-amount').value);
        const direction = document.querySelector('input[name="debt-direction"]:checked').value;
        const dueDate = document.getElementById('debt-due-date').value || null;
        const note = document.getElementById('debt-note').value || '';
        
        // Create debt object
        const debt = {
            person,
            amount,
            direction,
            dueDate,
            note,
            settled: false
        };
        
        try {
            // Get token from localStorage
            const token = getAuthToken();
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            // Send to MongoDB via API
            const response = await fetch('/api/debts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(debt)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Reset form
            debtForm.reset();
            
            // Close modal
            debtModal.style.display = 'none';
            
            // Reload debts
            loadDebts();
            
            // Show success message
            showNotification('Debt added successfully!');
        } catch (error) {
            console.error('Error adding debt:', error);
            showNotification('Error adding debt. Please try again.', 'error');
        }
    });
    
    // Load debts from MongoDB
    async function loadDebts() {
        try {
            const token = getAuthToken();
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            // Fetch debts from API
            const response = await fetch('/api/debts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Store all debts in memory
            debts = await response.json();
            
            // Filter based on active tab
            let filteredDebts = debts;
            if (activeTab === 'you-owe') {
                filteredDebts = debts.filter(debt => debt.direction === 'you_owe' && !debt.settled);
            } else if (activeTab === 'they-owe') {
                filteredDebts = debts.filter(debt => debt.direction === 'they_owe_you' && !debt.settled);
            } else if (activeTab === 'settled') {
                filteredDebts = debts.filter(debt => debt.settled);
            }
            
            // Render debts
            renderDebts(filteredDebts);
            
            // Also update debt totals
            updateDebtTotals();
        } catch (error) {
            console.error('Error loading debts:', error);
            // Display error message on the page
            debtList.innerHTML = '<div class="empty-state">Error loading debts. Please try again.</div>';
            // Set default values for totals
            youOweTotal.textContent = '₹0';
            theyOweTotal.textContent = '₹0';
            debtBalance.textContent = '₹0';
        }
    }
    
    // Update debt totals from MongoDB data
    function updateDebtTotals() {
        try {
            // Calculate totals from debts in memory
            const totals = {
                youOwe: 0,
                theyOweYou: 0
            };
            
            // Sum up all debts
            debts.forEach(debt => {
                if (!debt.settled) {
                    if (debt.direction === 'you_owe') {
                        totals.youOwe += debt.amount;
                    } else if (debt.direction === 'they_owe_you') {
                        totals.theyOweYou += debt.amount;
                    }
                }
            });
            
            // Update UI with totals
            youOweTotal.textContent = `₹${totals.youOwe.toFixed(2)}`;
            theyOweTotal.textContent = `₹${totals.theyOweYou.toFixed(2)}`;
            
            // Calculate balance
            const balance = totals.theyOweYou - totals.youOwe;
            debtBalance.textContent = `₹${balance.toFixed(2)}`;
            
            // Add appropriate class based on balance
            if (balance > 0) {
                debtBalance.classList.remove('negative');
                debtBalance.classList.add('positive');
            } else if (balance < 0) {
                debtBalance.classList.remove('positive');
                debtBalance.classList.add('negative');
            } else {
                debtBalance.classList.remove('positive', 'negative');
            }
        } catch (error) {
            console.error('Error loading debt totals:', error);
            // Set default values when there's an error
            youOweTotal.textContent = '₹0';
            theyOweTotal.textContent = '₹0';
            debtBalance.textContent = '₹0';
        }
    }
    
    // Render debts to the DOM
    function renderDebts(debts) {
        debtList.innerHTML = '';
        
        if (debts.length === 0) {
            debtList.innerHTML = '<div class="empty-state">No debts to display. Add a new debt to get started!</div>';
            return;
        }
        
        debts.forEach(debt => {
            const debtItem = document.createElement('div');
            debtItem.className = `debt-item ${debt.settled ? 'settled' : ''}`;
            
            const dueDate = debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : 'No due date';
            
            debtItem.innerHTML = `
                <div class="debt-info">
                    <div class="debt-person">${debt.person}</div>
                    <div class="debt-amount ${debt.direction === 'you_owe' ? 'negative' : 'positive'}">
                        ${debt.direction === 'you_owe' ? '-' : '+'} ₹${debt.amount}
                    </div>
                </div>
                <div class="debt-details">
                    <div class="debt-due-date">Due: ${dueDate}</div>
                    ${debt.note ? `<div class="debt-note">${debt.note}</div>` : ''}
                </div>
                <div class="debt-actions">
                    ${!debt.settled ? `<button class="settle-btn" data-id="${debt.id || debt._id}">Settle</button>` : ''}
                    <button class="delete-btn" data-id="${debt.id || debt._id}">Delete</button>
                </div>
            `;
            
            debtList.appendChild(debtItem);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.settle-btn').forEach(btn => {
            btn.addEventListener('click', handleSettleDebt);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteDebt);
        });
    }
    
    // Handle settling a debt
    async function handleSettleDebt(e) {
        const debtId = e.target.dataset.id;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Update debt in MongoDB via API
            const response = await fetch(`/api/debts/${debtId}`, {
                method: 'PATCH',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settled: true })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to settle debt');
            }
            
            // Reload debts
            loadDebts();
            
            // Update totals
            updateDebtTotals();
            
            showNotification('Debt marked as settled!');
        } catch (error) {
            console.error('Error settling debt:', error);
            showNotification('Error settling debt. Please try again.', 'error');
        }
    }
    
    // Handle deleting a debt
    async function handleDeleteDebt(e) {
        const debtId = e.target.dataset.id;
        
        if (!confirm('Are you sure you want to delete this debt?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }
            
            // Delete debt from MongoDB via API
            const response = await fetch(`/api/debts/${debtId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete debt');
            }
            
            // Reload debts
            loadDebts();
            
            // Update totals
            updateDebtTotals();
            
            showNotification('Debt deleted successfully!');
        } catch (error) {
            console.error('Error deleting debt:', error);
            showNotification('Error deleting debt. Please try again.', 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Check if user is logged in
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
    
    // Initial check and load
    if (checkAuth()) {
        loadDebts();
        //loadDebtTotals();
    }
});