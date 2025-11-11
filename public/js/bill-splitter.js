document.addEventListener('DOMContentLoaded', () => {
    const billAmountInput = document.getElementById('bill-amount');
    const numPeopleInput = document.getElementById('num-people');
    const namesSection = document.getElementById('names-section');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');
    const splitDetails = document.getElementById('split-details');

    numPeopleInput.addEventListener('input', () => {
        const numPeople = parseInt(numPeopleInput.value);
        if (numPeople > 0) {
            renderNameInputs(numPeople);
        } else {
            namesSection.innerHTML = '';
        }
    });

    calculateBtn.addEventListener('click', () => {
        const billAmount = parseFloat(billAmountInput.value);
        const numPeople = parseInt(numPeopleInput.value);

        if (billAmount > 0 && numPeople > 0) {
            const names = getNames(numPeople);
            const amountPerPerson = billAmount / numPeople;

            displaySplitDetails(names, amountPerPerson);
        } else {
            alert('Please enter a valid bill amount and number of people.');
        }
    });

    function renderNameInputs(numPeople) {
        namesSection.innerHTML = '';
        for (let i = 1; i <= numPeople; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Person ${i}'s Name`;
            input.classList.add('name-input');
            namesSection.appendChild(input);
        }
    }

    function getNames(numPeople) {
        const names = [];
        const nameInputs = document.querySelectorAll('.name-input');
        nameInputs.forEach((input, index) => {
            names.push(input.value || `Person ${index + 1}`);
        });
        return names;
    }

    function displaySplitDetails(names, amountPerPerson) {
        splitDetails.innerHTML = '';
        names.forEach(name => {
            const detail = document.createElement('div');
            detail.classList.add('split-detail');
            detail.innerHTML = `<span>${name} owes</span><span>₹${amountPerPerson.toFixed(2)}</span>`;
            splitDetails.appendChild(detail);
        });

        resultSection.style.display = 'block';
    }
});