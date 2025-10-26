// Spin Game Functionality
document.addEventListener('DOMContentLoaded', function() {
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const result = document.getElementById('spin-result');
    
    // Motivational messages for each section
    const motivationalMessages = [
        "Save a little every day, watch your dreams come true! 💰",
        "You're stronger than your excuses! Keep saving! 💪",
        "Stay focused on your goal, you're getting closer! 🎯",
        "Your future self will thank you for saving today! 🚀",
        "Small savings today, big rewards tomorrow! ✨",
        "You're on fire! Keep that savings momentum going! 🔥"
    ];
    
    // Create wheel sections
    const sections = 6;
    const sectionAngle = 360 / sections;
    const colors = ['#6c5ce7', '#a29bfe', '#fd79a8', '#fab1a0', '#74b9ff', '#55efc4'];
    const emojis = ['💰', '💪', '🎯', '🚀', '✨', '🔥'];
    
    // Create wheel sections
    for (let i = 0; i < sections; i++) {
        const section = document.createElement('div');
        section.className = 'wheel-section';
        section.style.transform = `rotate(${i * sectionAngle}deg)`;
        section.style.backgroundColor = colors[i];
        
        const emoji = document.createElement('span');
        emoji.className = 'section-emoji';
        emoji.textContent = emojis[i];
        emoji.style.transform = `rotate(${90 + sectionAngle / 2}deg)`;
        
        section.appendChild(emoji);
        wheel.appendChild(section);
    }
    
    // Add pointer
    const pointer = document.createElement('div');
    pointer.className = 'wheel-pointer';
    pointer.innerHTML = '↑';
    document.querySelector('.wheel-container').appendChild(pointer);
    
    // Spin functionality
    let canSpin = true;
    
    spinBtn.addEventListener('click', () => {
        if (!canSpin) return;
        
        // Disable spinning during animation
        canSpin = false;
        spinBtn.disabled = true;
        result.textContent = '';
        
        // Random rotation between 5-10 full rotations + random section
        const rotations = 5 + Math.floor(Math.random() * 5);
        const extraDegrees = Math.floor(Math.random() * 360);
        const totalDegrees = rotations * 360 + extraDegrees;
        
        // Apply rotation
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
        wheel.style.transform = `rotate(${totalDegrees}deg)`;
        
        // Determine which section landed
        setTimeout(() => {
            // Calculate which section is at the pointer (opposite to the rotation)
            const normalizedDegrees = extraDegrees % 360;
            const sectionIndex = Math.floor(normalizedDegrees / sectionAngle);
            const reversedIndex = (sections - sectionIndex) % sections;
            
            // Display result
            result.innerHTML = `<div class="result-emoji">${emojis[reversedIndex]}</div>
                               <p>${motivationalMessages[reversedIndex]}</p>`;
            
            // Re-enable spinning
            setTimeout(() => {
                canSpin = true;
                spinBtn.disabled = false;
            }, 500);
        }, 4000);
    });
});