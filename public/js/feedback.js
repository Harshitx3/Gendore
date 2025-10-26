// Feedback Form Functionality

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const feedbackType = document.getElementById('feedbackType').value;
            const message = document.getElementById('message').value;
            
            // Simple validation
            if (!name || !email || !message) {
                alert('Please fill in all required fields');
                return;
            }
            
            // In a real application, you would send this data to your server
            // For now, we'll just show a success message
            alert('Thank you for your feedback! We will get back to you soon.');
            
            // Reset the form
            contactForm.reset();
        });
    }
    
    // Add click-to-copy functionality for contact information
    const whatsappLink = document.querySelector('.contact-card a[href^="https://wa.me"]');
    const emailLink = document.querySelector('.contact-card a[href^="mailto"]');
    
    if (whatsappLink) {
        whatsappLink.addEventListener('click', function(e) {
            // This will still allow the default action (opening WhatsApp)
            // but also provides feedback to the user
            const phoneNumber = whatsappLink.textContent;
            navigator.clipboard.writeText(phoneNumber)
                .then(() => {
                    // Create a temporary tooltip
                    const tooltip = document.createElement('span');
                    tooltip.textContent = 'Phone number copied!';
                    tooltip.style.position = 'absolute';
                    tooltip.style.backgroundColor = '#333';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '5px 10px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '12px';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.top = (e.clientY - 40) + 'px';
                    tooltip.style.left = e.clientX + 'px';
                    
                    document.body.appendChild(tooltip);
                    
                    // Remove the tooltip after 2 seconds
                    setTimeout(() => {
                        document.body.removeChild(tooltip);
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });
    }
    
    if (emailLink) {
        emailLink.addEventListener('click', function(e) {
            // This will still allow the default action (opening email client)
            // but also provides feedback to the user
            const email = emailLink.textContent;
            navigator.clipboard.writeText(email)
                .then(() => {
                    // Create a temporary tooltip
                    const tooltip = document.createElement('span');
                    tooltip.textContent = 'Email copied!';
                    tooltip.style.position = 'absolute';
                    tooltip.style.backgroundColor = '#333';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '5px 10px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '12px';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.top = (e.clientY - 40) + 'px';
                    tooltip.style.left = e.clientX + 'px';
                    
                    document.body.appendChild(tooltip);
                    
                    // Remove the tooltip after 2 seconds
                    setTimeout(() => {
                        document.body.removeChild(tooltip);
                    }, 2000);
                })
                .catch(err => {
                    console.error('Could not copy text: ', err);
                });
        });
    }
});