document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const suggestionsEl = document.getElementById('suggestions');

  const renderMessage = (text, sender = 'ai', html = false) => {
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    if (html && sender === 'ai') {
      div.innerHTML = text;
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  };

  const showTyping = () => {
    const div = document.createElement('div');
    div.className = 'msg ai typing';
    div.innerHTML = '<span class="dots"></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  };

  const typeReply = (text) => {
    const typing = showTyping();
    const delay = Math.min(1200, Math.max(400, text.length * 15));
    setTimeout(() => {
      typing.remove();
      renderMessage(text, 'ai', true);
    }, delay);
  };

  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const state = { lastIntent: '', seen: {} };

  const intents = [
    {
      keys: ['save','saving','budget','pocket','manage','cut costs','cheap'],
      tips: [
        'Skip Zomato 2 days/week 🍲, track daily spends 🧮, stash ₹50–100 weekly 💰',
        'Set a ₹300 snack cap/week 🍟 and auto-transfer ₹100 to savings 💸',
        'Use 50-30-20: needs-wants-savings 🧮 and review weekly 📈'
      ],
      link: '<a href="expense.html">Track expenses</a>'
    },
    {
      keys: ['split','splitter','splitwise','shared','divide','evenly','fair'],
      tips: [
        'Use Gendore’s Bill Splitter 🤝💸 — add friends, split evenly, settle cleanly!',
        'Create per-person shares and log payments to avoid drama 😅',
        'Share trip costs daily and settle at checkout 🧾'
      ],
      link: '<a href="bill-splitter.html">Open Bill Splitter</a>'
    },
    {
      keys: ['debt','udharr','udhar','owe','owed','pay back','repay','borrow','lend'],
      tips: [
        'Send a chill reminder 🫡, set a due date, track it in Debt tab 💸',
        'Agree on date + amount, write it down, and nudge politely 📩',
        'Split big dues into smaller weekly paybacks 🗓️'
      ],
      link: '<a href="debt.html">Track debt</a>'
    },
    {
      keys: ['zomato','swiggy','pizza','snack','maggi','food','eat'],
      tips: [
        'Cook at home 2–3 days 🍲, set a weekly snack budget, cap orders to weekends 💰',
        'Buy bulk basics (rice, eggs, maggi) and meal prep 🧑‍🍳',
        'Use cashback wallets for orders and track caps 🧾'
      ]
    },
    {
      keys: ['rent','hostel','room','pg'],
      tips: [
        'Pay rent first 😎, then budget for fun 💰',
        'Split utilities fairly and keep a shared log 📝',
        'Negotiate renewal or find a roommate to cut costs 🫱🏼‍🫲🏽'
      ]
    },
    {
      keys: ['trip','travel','goa','vacation','journey'],
      tips: [
        'Make a per-person budget 🧮, split bookings fairly, track spends daily 🏖️💸',
        'Lock travel + stay first, then plan food/activities caps 🍽️',
        'Keep one treasurer and update the group log daily 📣'
      ]
    },
    {
      keys: ['fees','scholarship','college','exam'],
      tips: [
        'Prioritize fees first 🧾, cut non-essentials, stash a small emergency fund 💰',
        'Check scholarship deadlines and set reminders ⏰',
        'Reduce subscriptions during exam season and cook more 🍲'
      ]
    },
    {
      keys: ['expense','expenses','spend','spending','track','log'],
      tips: [
        'Log every spend 🧮, review weekly, set category limits (food, travel, misc) 💸',
        'Use daily notes or Gendore to track and spot patterns 🔍',
        'Set a ₹100 impulse buffer and stop at the limit 🚦'
      ],
      link: '<a href="expense.html">Open Expenses</a>'
    },
    {
      keys: ['income','part-time','freelance','earn','side'],
      tips: [
        'Try small gigs: notes typing, tutoring, campus stalls 💼',
        'Sell unused stuff, keep 50% to savings 🧳',
        'Learn a micro-skill and charge ₹200–500/start 📈'
      ]
    },
    {
      keys: ['subscription','netflix','spotify','prime','membership'],
      tips: [
        'Pause unused subs and share family plans 🤝',
        'Rotate subscriptions monthly and avoid overlaps 🔄',
        'Track renewal dates and set cancel reminders ⏳'
      ]
    }
  ];

  const respond = (q) => {
    const text = (q || '').trim();
    if (!text) return '';
    const msg = text.toLowerCase();

    const isMoney = intents.some(i => i.keys.some(k => msg.includes(k))) || ['money','cash','budget','bill','split','debt','rent','fees'].some(k => msg.includes(k));
    if (!isMoney) {
      return rnd([
        'I’m your money buddy 💸 — ask me budgets, debts, or splits! 😄',
        'Let’s talk cash, not calculus 😅. Try trips, rent, or expenses!',
        'Money talk time 🧮 — ask about saving, splitting, or udharr!'
      ]);
    }

    const found = intents.find(i => i.keys.some(k => msg.includes(k)));
    if (found) {
      const key = found.keys[0];
      state.seen[key] = (state.seen[key] || 0) + 1;
      const tip = found.tips[(state.seen[key] - 1) % found.tips.length] || rnd(found.tips);
      const extra = found.link ? ` • ${found.link}` : '';
      return `${tip}${extra ? ' ' + extra : ''}`;
    }

    return rnd([
      'Track spends daily 🧮, dodge impulse buys 😂, save a tiny chunk weekly 💰',
      'Keep it simple: budget, track, and split fairly. Your wallet will smile 😎',
      'Small consistent saves beat big random cuts. You got this 💪💸'
    ]);
  };

  const handleSend = () => {
    const userText = inputEl.value.trim();
    if (!userText) return;
    renderMessage(userText, 'user');
    const reply = respond(userText);
    typeReply(reply);
    inputEl.value = '';
    inputEl.focus();
  };

  sendBtn.addEventListener('click', handleSend);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  const chips = [
    'How to save money',
    'Split bill for trip',
    'Track daily expenses',
    'Pay back udharr',
    'Reduce food spending',
    'Plan hostel rent',
    'Scholarship tips',
    'Weekly budget idea'
  ];
  if (suggestionsEl) {
    chips.forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = c;
      chip.addEventListener('click', () => {
        inputEl.value = c;
        handleSend();
      });
      suggestionsEl.appendChild(chip);
    });
  }

  renderMessage('Yo! I’m Gendore AI 🤖💸 — ask me money/student finance stuff and I’ll drop quick tips!');
});
