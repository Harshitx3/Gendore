class BillSplitterPro {
    constructor() {
        this.groups = [];
        this.currentGroup = null;
        this.chart = null;
        this.init();
    }

    init() {
        // Require authentication and then load groups from server
        if (!requireAuth()) return;
        this.setupEventListeners();
        this.fetchGroupsFromServer().then(() => {
            this.renderGroupsList();
            this.showSection('groups-list');
        });
    }

    setupEventListeners() {
        // Group creation
        document.getElementById('create-group-btn').addEventListener('click', () => this.createGroup());
        document.getElementById('create-new-group').addEventListener('click', () => this.showSection('group-creation'));
        
        // Navigation
        document.getElementById('back-to-groups').addEventListener('click', () => this.showSection('groups-list'));
        
        // Expense management
        document.getElementById('add-expense-btn').addEventListener('click', () => this.addExpense());
        
        // Settlement
        document.getElementById('confirm-settlement').addEventListener('click', () => this.confirmSettlement());
        document.querySelector('.close').addEventListener('click', () => this.closeSettlementModal());
        
        // Export
        document.getElementById('export-pdf').addEventListener('click', () => this.exportToPDF());
        document.getElementById('export-summary').addEventListener('click', () => this.exportSummary());
        
        // Expense form updates
        document.getElementById('who-paid').addEventListener('change', () => this.updateSplitCheckboxes());
    }

    async createGroup() {
        const name = document.getElementById('group-name').value.trim();
        const membersText = document.getElementById('group-members').value.trim();
        
        if (!name || !membersText) {
            alert('Please fill in all fields');
            return;
        }
        
        const members = membersText.split('\n').map(member => member.trim()).filter(member => member);
        
        // Persist to server
        try {
            const response = await fetch('/api/bills', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, members })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const saved = await response.json();
            const group = {
                id: saved._id,
                name: saved.name,
                members: saved.members,
                expenses: saved.expenses || [],
                settlements: saved.settlements || [],
                createdAt: saved.createdAt
            };
            this.groups.push(group);
            this.saveGroups();
        } catch (err) {
            console.error('Error creating group:', err);
            alert('Could not create group. Please try again.');
            return;
        }
        
        // Clear form
        document.getElementById('group-name').value = '';
        document.getElementById('group-members').value = '';
        
        this.renderGroupsList();
        this.showSection('groups-list');
    }

    renderGroupsList() {
        const container = document.getElementById('groups-container');
        container.innerHTML = '';
        
        this.groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `
                <h3>${group.name}</h3>
                <p>${group.members.length} members</p>
                <p>Total: ₹${this.getGroupTotal(group).toFixed(2)}</p>
                <button onclick="billSplitter.openGroup('${group.id}')" class="btn-calculate">
                    Open Group
                </button>
            `;
            container.appendChild(groupCard);
        });
    }

    getGroupTotal(group) {
        return group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }

    async openGroup(groupId) {
        // Fetch latest group data from server
        await this.fetchGroupFromServer(groupId);
        if (!this.currentGroup) return;
        
        document.getElementById('dashboard-title').textContent = this.currentGroup.name;
        document.getElementById('total-expenses').textContent = `₹${this.getGroupTotal(this.currentGroup).toFixed(2)}`;
        document.getElementById('member-count').textContent = this.currentGroup.members.length;
        
        this.populateWhoPaidSelect();
        this.renderExpenses();
        this.calculateSettlements();
        this.showSection('group-dashboard');
    }

    populateWhoPaidSelect() {
        const select = document.getElementById('who-paid');
        select.innerHTML = '';
        this.currentGroup.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member;
            option.textContent = member;
            select.appendChild(option);
        });
        this.updateSplitCheckboxes();
    }

    updateSplitCheckboxes() {
        const container = document.getElementById('split-between');
        container.innerHTML = '';
        
        this.currentGroup.members.forEach(member => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" value="${member}" checked> ${member}
            `;
            container.appendChild(label);
        });
    }

    async addExpense() {
        const description = document.getElementById('expense-description').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const whoPaid = document.getElementById('who-paid').value;
        const splitBetween = Array.from(document.querySelectorAll('#split-between input:checked')).map(cb => cb.value);
        
        if (!description || !amount || splitBetween.length === 0) {
            alert('Please fill in all fields');
            return;
        }
        
        const expense = {
            id: Date.now(),
            description: description,
            amount: amount,
            whoPaid: whoPaid,
            splitBetween: splitBetween,
            date: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`/api/bills/${this.currentGroup.id}/expenses`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ description, amount, whoPaid, splitBetween, date: expense.date })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const updated = await response.json();
            this.currentGroup = {
                id: updated._id,
                name: updated.name,
                members: updated.members,
                expenses: updated.expenses || [],
                settlements: updated.settlements || []
            };
            // Update in list
            const idx = this.groups.findIndex(g => g.id === this.currentGroup.id);
            if (idx >= 0) this.groups[idx] = this.currentGroup;
            this.saveGroups();
        } catch (err) {
            console.error('Error adding expense:', err);
            alert('Could not add expense. Please try again.');
            return;
        }
        
        // Clear form
        document.getElementById('expense-description').value = '';
        document.getElementById('expense-amount').value = '';
        
        this.renderExpenses();
        this.calculateSettlements();
        this.updateStats();
    }

    renderExpenses() {
        const container = document.getElementById('expenses-list');
        container.innerHTML = '';
        
        this.currentGroup.expenses.slice(-10).reverse().forEach(expense => {
            const expenseDiv = document.createElement('div');
            expenseDiv.className = 'expense-item';
            expenseDiv.innerHTML = `
                <div class="expense-header">
                    <strong>${expense.description}</strong>
                    <span>₹${expense.amount.toFixed(2)}</span>
                </div>
                <div class="expense-details">
                    <span>${expense.whoPaid} paid</span>
                    <span>Split between: ${expense.splitBetween.join(', ')}</span>
                    <span>${new Date(expense.date).toLocaleDateString()}</span>
                </div>
            `;
            container.appendChild(expenseDiv);
        });
    }

    calculateSettlements() {
        const balances = {};
        
        // Initialize balances
        this.currentGroup.members.forEach(member => {
            balances[member] = 0;
        });
        
        // Calculate balances from expenses
        this.currentGroup.expenses.forEach(expense => {
            const amountPerPerson = expense.amount / expense.splitBetween.length;
            
            // Person who paid gets credit
            balances[expense.whoPaid] += expense.amount;
            
            // People who split owe money
            expense.splitBetween.forEach(person => {
                balances[person] -= amountPerPerson;
            });
        });
        
        // Apply settlements
        this.currentGroup.settlements.forEach(settlement => {
            balances[settlement.from] += settlement.amount;
            balances[settlement.to] -= settlement.amount;
        });
        
        this.displaySettlements(balances);
        this.updateChart(balances);
    }

    displaySettlements(balances) {
        const container = document.getElementById('settlement-summary');
        container.innerHTML = '';
        
        const creditors = [];
        const debtors = [];
        
        Object.entries(balances).forEach(([person, balance]) => {
            if (balance > 0.01) {
                creditors.push({ person, amount: balance });
            } else if (balance < -0.01) {
                debtors.push({ person, amount: -balance });
            }
        });
        
        if (creditors.length === 0 && debtors.length === 0) {
            container.innerHTML = '<p class="no-settlements">All settled! 🎉</p>';
            return;
        }
        
        // Simple settlement algorithm
        let i = 0, j = 0;
        while (i < creditors.length && j < debtors.length) {
            const settlementAmount = Math.min(creditors[i].amount, debtors[j].amount);
            
            const settlementDiv = document.createElement('div');
            settlementDiv.className = 'settlement-item';
            settlementDiv.innerHTML = `
                <span>${debtors[j].person} → ${creditors[i].person}</span>
                <span>₹${settlementAmount.toFixed(2)}</span>
                <button onclick="billSplitter.showSettlementModal('${debtors[j].person}', '${creditors[i].person}', ${settlementAmount})" class="btn-settle">
                    Settle
                </button>
            `;
            container.appendChild(settlementDiv);
            
            creditors[i].amount -= settlementAmount;
            debtors[j].amount -= settlementAmount;
            
            if (creditors[i].amount < 0.01) i++;
            if (debtors[j].amount < 0.01) j++;
        }
        
        document.getElementById('unsettled-count').textContent = 
            creditors.length + debtors.length;
    }

    showSettlementModal(from, to, amount) {
        document.getElementById('settlement-text').textContent = 
            `${from} pays ${to}:`;
        document.getElementById('settlement-amount').value = amount.toFixed(2);
        document.getElementById('settlement-note').value = '';
        document.getElementById('settlement-modal').style.display = 'block';
        
        this.pendingSettlement = { from, to, amount };
    }

    closeSettlementModal() {
        document.getElementById('settlement-modal').style.display = 'none';
        this.pendingSettlement = null;
    }

    async confirmSettlement() {
        if (!this.pendingSettlement) return;
        
        const settlement = {
            ...this.pendingSettlement,
            note: document.getElementById('settlement-note').value.trim(),
            date: new Date().toISOString()
        };
        
        try {
            const response = await fetch(`/api/bills/${this.currentGroup.id}/settlements`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(settlement)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const updated = await response.json();
            this.currentGroup = {
                id: updated._id,
                name: updated.name,
                members: updated.members,
                expenses: updated.expenses || [],
                settlements: updated.settlements || []
            };
            const idx = this.groups.findIndex(g => g.id === this.currentGroup.id);
            if (idx >= 0) this.groups[idx] = this.currentGroup;
            this.saveGroups();
        } catch (err) {
            console.error('Error recording settlement:', err);
            alert('Could not record settlement. Please try again.');
            return;
        }
        
        this.closeSettlementModal();
        this.calculateSettlements();
        this.updateStats();
    }

    updateChart(balances) {
        const ctx = document.getElementById('balance-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = Object.keys(balances);
        const data = Object.values(balances);
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance',
                    data: data,
                    backgroundColor: data.map(value => value >= 0 ? '#4CAF50' : '#F44336'),
                    borderColor: data.map(value => value >= 0 ? '#45a049' : '#da190b'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Member Balances'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateStats() {
        document.getElementById('total-expenses').textContent = 
            `₹${this.getGroupTotal(this.currentGroup).toFixed(2)}`;
        document.getElementById('member-count').textContent = this.currentGroup.members.length;
    }

    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(this.currentGroup.name, 20, 30);
        
        doc.setFontSize(12);
        doc.text('Expense Summary', 20, 50);
        
        let y = 60;
        this.currentGroup.expenses.forEach(expense => {
            doc.text(`${expense.description}: ₹${expense.amount.toFixed(2)} (${expense.whoPaid})`, 20, y);
            y += 10;
        });
        
        doc.text('Settlements', 20, y + 10);
        y += 20;
        
        const balances = {};
        this.calculateSettlementsForExport(balances);
        
        Object.entries(balances).forEach(([person, balance]) => {
            if (Math.abs(balance) > 0.01) {
                doc.text(`${person}: ${balance > 0 ? 'Gets' : 'Owes'} ₹${Math.abs(balance).toFixed(2)}`, 20, y);
                y += 10;
            }
        });
        
        doc.save(`${this.currentGroup.name.replace(/\s+/g, '_')}_summary.pdf`);
    }

    calculateSettlementsForExport(balances) {
        this.currentGroup.members.forEach(member => {
            balances[member] = 0;
        });
        
        this.currentGroup.expenses.forEach(expense => {
            const amountPerPerson = expense.amount / expense.splitBetween.length;
            balances[expense.whoPaid] += expense.amount;
            expense.splitBetween.forEach(person => {
                balances[person] -= amountPerPerson;
            });
        });
        
        this.currentGroup.settlements.forEach(settlement => {
            balances[settlement.from] += settlement.amount;
            balances[settlement.to] -= settlement.amount;
        });
    }

    exportSummary() {
        const summary = {
            group: this.currentGroup,
            total: this.getGroupTotal(this.currentGroup),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(summary, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${this.currentGroup.name.replace(/\s+/g, '_')}_summary.json`;
        link.click();
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
    }

    saveGroups() {
        // Keep local copy for quick reloads; source of truth is server
        localStorage.setItem('billSplitterGroups', JSON.stringify(this.groups));
    }

    async fetchGroupsFromServer() {
        try {
            const response = await fetch('/api/bills', { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const groups = await response.json();
            this.groups = groups.map(g => ({
                id: g._id,
                name: g.name,
                members: g.members,
                expenses: g.expenses || [],
                settlements: g.settlements || [],
                createdAt: g.createdAt
            }));
        } catch (err) {
            console.error('Error fetching groups:', err);
            // fall back to local storage
            this.groups = JSON.parse(localStorage.getItem('billSplitterGroups')) || [];
        }
    }

    async fetchGroupFromServer(groupId) {
        try {
            const response = await fetch(`/api/bills/${groupId}`, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const g = await response.json();
            this.currentGroup = {
                id: g._id,
                name: g.name,
                members: g.members,
                expenses: g.expenses || [],
                settlements: g.settlements || []
            };
        } catch (err) {
            console.error('Error fetching group:', err);
            this.currentGroup = this.groups.find(g => g.id === groupId) || null;
        }
    }
}

// Initialize the app after DOM and auth
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    window.billSplitter = new BillSplitterPro();
});