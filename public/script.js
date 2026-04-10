// ===========================================
// FACILITY PRICING DATA
// ===========================================
const facilityPricing = {
    'Attica Correctional Facility': { adult: 140, child: 100 },
    'Auburn Correctional Facility': { adult: 100, child: 65 },
    'Cayuga Correctional Facility': { adult: 100, child: 65 },
    'Elmira Correctional Facility': { adult: 100, child: 65 },
    'Five Points Correctional Facility': { adult: 100, child: 65 },
    'Groveland Correctional Facility': { adult: 140, child: 100 },
    'Marcy Correctional Facility': { adult: 110, child: 65 },
    'Mid-State Correctional Facility': { adult: 110, child: 65 },
    'Mohawk Correctional Facility': { adult: 110, child: 60 },
    'Orleans Correctional Facility': { adult: 110, child: 100 },
    'Wende Correctional Facility': { adult: 110, child: 100 },
    'Wyoming Correctional Facility': { adult: 140, child: 100 }
};

const DEPOSIT_PER_SEAT = 40;

// Mobile Navigation Toggle
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');

        const target = document.querySelector(href);
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(248, 248, 248, 0.98)';
        navbar.style.boxShadow = '0 1px 20px rgba(0, 0, 0, 0.08)';
    } else {
        navbar.style.background = 'rgba(248, 248, 248, 0.97)';
        navbar.style.boxShadow = 'none';
    }
});

// Form handling
const bookingForm = document.getElementById('booking-form');

// ===========================================
// PRICE CALCULATOR LOGIC
// ===========================================
function calculatePrice() {
    const facilitySelect = document.getElementById('facility');
    const adultsSelect = document.getElementById('adults');
    const childrenSelect = document.getElementById('children');
    const priceCalculator = document.getElementById('price-calculator');

    const facility = facilitySelect.value;
    const adults = parseInt(adultsSelect.value) || 0;
    const children = parseInt(childrenSelect.value) || 0;

    // Only show calculator if facility and at least 1 adult selected
    if (!facility || adults === 0) {
        priceCalculator.style.display = 'none';
        return null;
    }

    // Get pricing for selected facility
    const pricing = facilityPricing[facility];
    if (!pricing) {
        console.error('Pricing not found for facility:', facility);
        return null;
    }

    // Calculate costs
    const adultsTotal = adults * pricing.adult;
    const childrenTotal = children * pricing.child;
    const tripTotal = adultsTotal + childrenTotal;
    const totalSeats = adults + children;
    const depositTotal = totalSeats * DEPOSIT_PER_SEAT;
    const balanceDue = tripTotal - depositTotal;

    // Update calculator display
    document.getElementById('calc-facility').textContent = facility;

    // Adults row
    if (adults > 0) {
        document.getElementById('adults-row').style.display = 'flex';
        document.getElementById('calc-adults-count').textContent = adults;
        document.getElementById('calc-adults-price').textContent = `$${pricing.adult} × ${adults} = $${adultsTotal}`;
    } else {
        document.getElementById('adults-row').style.display = 'none';
    }

    // Children row
    if (children > 0) {
        document.getElementById('children-row').style.display = 'flex';
        document.getElementById('calc-children-count').textContent = children;
        document.getElementById('calc-children-price').textContent = `$${pricing.child} × ${children} = $${childrenTotal}`;
    } else {
        document.getElementById('children-row').style.display = 'none';
    }

    // Totals
    document.getElementById('calc-total').textContent = `$${tripTotal}`;
    document.getElementById('calc-deposit').textContent = `$${depositTotal}`;
    document.getElementById('calc-balance').textContent = `$${balanceDue}`;

    // Show calculator
    priceCalculator.style.display = 'block';

    // Update payment button text
    const buttonText = document.getElementById('button-text');
    if (buttonText) {
        buttonText.textContent = `Pay $${depositTotal} Deposit & Book`;
    }

    // Update payment section deposit amount
    const paymentAmountDisplay = document.getElementById('payment-amount-display');
    const paymentDepositAmount = document.getElementById('payment-deposit-amount');
    if (paymentAmountDisplay && paymentDepositAmount) {
        paymentAmountDisplay.style.display = 'flex';
        paymentDepositAmount.textContent = `$${depositTotal}.00`;
    }

    return {
        facility,
        adults,
        children,
        adultsPrice: adultsTotal,
        childrenPrice: childrenTotal,
        totalPrice: tripTotal,
        depositAmount: depositTotal,
        balanceDue: balanceDue
    };
}

// Add event listeners to form fields
document.getElementById('facility')?.addEventListener('change', calculatePrice);
document.getElementById('adults')?.addEventListener('change', calculatePrice);
document.getElementById('children')?.addEventListener('change', calculatePrice);

// Children documentation warning
document.getElementById('children')?.addEventListener('change', function() {
    const count = parseInt(this.value) || 0;
    const section = document.getElementById('children-docs-section');
    const consent = document.getElementById('children-docs-consent');
    if (!section) return;
    if (count > 0) {
        section.style.display = 'block';
        if (consent) consent.required = true;
    } else {
        section.style.display = 'none';
        if (consent) { consent.required = false; consent.checked = false; }
    }
});

// Booking form submission
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const bookingData = Object.fromEntries(formData);

        // Validate form
        if (!validateBookingForm(bookingData)) {
            return;
        }

        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const buttonText = document.getElementById('button-text');
        const spinner = document.getElementById('spinner');
        const originalText = buttonText.textContent;

        buttonText.textContent = 'Processing Payment...';
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            // Clear any previous payment errors
            clearPaymentError();

            // Calculate deposit amount based on number of seats
            const priceInfo = calculatePrice();
            if (!priceInfo) {
                throw new Error('Please select facility and number of adults');
            }

            // TEST MODE - skip payment, submit booking directly
            buttonText.textContent = 'Saving Booking...';

            // Transform field names for server (hyphens to underscores)
            const serverData = {
                name: bookingData.name,
                phone: bookingData.phone,
                email: bookingData.email,
                facility: bookingData.facility,
                visit_date: bookingData['visit-date'],
                pickup_location: bookingData['pickup-location'],
                adults: parseInt(bookingData.adults) || 1,
                children: parseInt(bookingData.children) || 0,
                guests: (parseInt(bookingData.adults) || 1) + (parseInt(bookingData.children) || 0),
                notes: bookingData.notes || '',
                payment_intent_id: 'TEST_MODE',
                payment_status: 'test',
                deposit_amount: priceInfo.depositAmount,
                total_cost: priceInfo.totalPrice,
                balance_due: priceInfo.balanceDue
            };

            const response = await fetch(`${API_BASE}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serverData)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to save booking');
            }

            console.log('✅ Booking saved successfully!');

            // Show success screen
            showBookingSuccess(data.bookingId, serverData, priceInfo);

            // Reset form and card element
            this.reset();
            if (cardElement) cardElement.clear();

            // Reset children docs section
            const docsSection = document.getElementById('children-docs-section');
            const docsConsent = document.getElementById('children-docs-consent');
            if (docsSection) docsSection.style.display = 'none';
            if (docsConsent) { docsConsent.checked = false; docsConsent.required = false; }

        } catch (error) {
            console.error('Booking error:', error);
            showPaymentError(error.message || 'Payment failed. Please try again or call (917) 244-5352.');
            showNotification('Booking failed: ' + error.message, 'error');
        } finally {
            buttonText.textContent = originalText;
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

// Returns the two bookable dates (Sat + Sun) for the current booking window
function getBookableWeekend() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

    let saturday = null;
    let sunday = null;

    if (day === 0) {
        // Sunday — this weekend is closed, next weekend opens
        saturday = new Date(today); saturday.setDate(today.getDate() + 6);
        sunday   = new Date(today); sunday.setDate(today.getDate() + 7);
    } else if (day === 6) {
        // Saturday — today is blocked, only this Sunday is open
        sunday = new Date(today); sunday.setDate(today.getDate() + 1);
    } else {
        // Mon–Fri — this week's Sat and Sun are open
        const daysUntilSat = 6 - day;
        saturday = new Date(today); saturday.setDate(today.getDate() + daysUntilSat);
        sunday   = new Date(today); sunday.setDate(today.getDate() + daysUntilSat + 1);
    }

    const fmt = d => d ? d.toISOString().split('T')[0] : null;
    return { saturday, sunday, satStr: fmt(saturday), sunStr: fmt(sunday) };
}

// Form validation
function validateBookingForm(data) {
    const requiredFields = ['name', 'phone', 'email', 'adults', 'facility', 'visit-date', 'pickup-location'];
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-group input, .form-group select').forEach(el => {
        el.style.borderColor = '#e5e7eb';
    });
    
    requiredFields.forEach(field => {
        console.log(`Checking field ${field}: "${data[field]}"`);
        if (!data[field] || data[field].trim() === '') {
            console.log(`Field ${field} is missing or empty`);
            isValid = false;
            showFieldError(field, 'This field is required');
        }
    });
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        isValid = false;
        showFieldError('email', 'Please enter a valid email address');
    }
    
    // Phone validation
    if (data.phone && !isValidPhone(data.phone)) {
        isValid = false;
        showFieldError('phone', 'Please enter a valid phone number');
    }
    
    // Date validation — only this weekend's open dates are allowed
    if (data['visit-date']) {
        const { satStr, sunStr } = getBookableWeekend();
        if (data['visit-date'] !== satStr && data['visit-date'] !== sunStr) {
            isValid = false;
            showFieldError('visit-date', 'Bookings are only accepted for this weekend. Please select an available date.');
        }
    }

    // SMS consent validation
    const smsConsentCheckbox = document.getElementById('sms-consent');
    if (smsConsentCheckbox && !smsConsentCheckbox.checked) {
        isValid = false;
        showFieldError('sms-consent', 'You must consent to receive SMS notifications to complete your booking');
    }

    // Children docs consent validation
    if ((parseInt(data.children) || 0) > 0) {
        const docsConsent = document.getElementById('children-docs-consent');
        if (!docsConsent || !docsConsent.checked) {
            isValid = false;
            showNotification('Please confirm you have read the children documentation requirements.', 'warning');
        }
    }

    return isValid;
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    field.style.borderColor = '#ef4444';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Booking storage and management
function storeBooking(booking) {
    let bookings = JSON.parse(localStorage.getItem('wcf-bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('wcf-bookings', JSON.stringify(bookings));
}

function getBooking(bookingId) {
    const bookings = JSON.parse(localStorage.getItem('wcf-bookings') || '[]');
    return bookings.find(booking => booking.id === bookingId);
}

function updateBookingStatus(bookingId, status) {
    let bookings = JSON.parse(localStorage.getItem('wcf-bookings') || '[]');
    const bookingIndex = bookings.findIndex(booking => booking.id === bookingId);
    
    if (bookingIndex !== -1) {
        bookings[bookingIndex].status = status;
        localStorage.setItem('wcf-bookings', JSON.stringify(bookings));
    }
}

function getAllBookings() {
    return JSON.parse(localStorage.getItem('wcf-bookings') || '[]');
}

// Owner notification system
function sendOwnerNotification(booking) {
    const notificationType = booking.notifications || 'email';
    const message = formatOwnerNotification(booking);
    
    // Store notification
    storeNotification({
        type: notificationType,
        message: message,
        booking: booking,
        timestamp: new Date().toISOString()
    });
    
    // In production, send actual SMS/email here
    console.log(`${notificationType.toUpperCase()} Notification:`, message);
}

function formatOwnerNotification(booking) {
    if (booking.action === 'checked_in') {
        return `✅ ${booking.name} has checked in for their visit to ${booking.facility}. Contact: ${booking.phone}`;
    } else {
        return `📅 New booking: ${booking.name} scheduled for ${booking.facility} on ${booking['visit-date']}. Visitors: ${booking.visitors}. Contact: ${booking.phone}. Notifications: ${booking.notifications === 'sms' ? 'SMS' : 'Email'}`;
    }
}

function storeNotification(notification) {
    let notifications = JSON.parse(localStorage.getItem('wcf-notifications') || '[]');
    notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
        notifications = notifications.slice(0, 100);
    }
    
    localStorage.setItem('wcf-notifications', JSON.stringify(notifications));
}


// Facility Details Modal (Southern facilities)
const facilityModal = document.getElementById('facility-modal');
const facilityModalClose = document.getElementById('facility-modal-close');

// Northern Facilities Modal
const northernFacilityModal = document.getElementById('northern-facility-modal');
const northernFacilityModalClose = document.getElementById('northern-facility-modal-close');

// Central Facilities Modal
const centralFacilityModal = document.getElementById('central-facility-modal');
const centralFacilityModalClose = document.getElementById('central-facility-modal-close');

// Western Facilities Modal
const westernFacilityModal = document.getElementById('western-facility-modal');
const westernFacilityModalClose = document.getElementById('western-facility-modal-close');

// Sunday-only Facilities Modal
const sundayOnlyModal = document.getElementById('sunday-only-facility-modal');
const sundayOnlyModalClose = document.getElementById('sunday-only-facility-modal-close');

// Otisville Facilities Modal Elements
const otisvilleFacilityModal = document.getElementById('otisville-facility-modal');
const otisvilleFacilityModalClose = document.getElementById('otisville-facility-modal-close');

const facilityDetailsButtons = document.querySelectorAll('.facility-details-btn');

// Add click event listeners to all facility detail buttons
facilityDetailsButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const facility = button.getAttribute('data-facility');
        
        // Show southern facilities modal
        if (facility === 'coxsackie' || facility === 'greene' || facility === 'washington') {
            facilityModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        // Show northern facilities modal
        else if (facility === 'clinton' || facility === 'altona' || facility === 'franklin' || 
                 facility === 'barehill' || facility === 'upstate' || facility === 'adirondack' || facility === 'raybrook') {
            northernFacilityModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        // Show central facilities modal
        else if (facility === 'mohawk' || facility === 'midstate' || facility === 'marcy') {
            centralFacilityModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        // Show western facilities modal
        else if (facility === 'collins' || facility === 'lakeview') {
            westernFacilityModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        // Show Sunday-only facilities modal
        else if (facility === 'gouverneur' || facility === 'riverview' || facility === 'capevincent') {
            sundayOnlyModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
        // Show Otisville facilities modal
        else if (facility === 'otisville') {
            otisvilleFacilityModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    });
});

// Close southern facility modal when clicking X button
if (facilityModalClose) {
    facilityModalClose.addEventListener('click', () => {
        facilityModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close northern facility modal when clicking X button
if (northernFacilityModalClose) {
    northernFacilityModalClose.addEventListener('click', () => {
        northernFacilityModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close central facility modal when clicking X button
if (centralFacilityModalClose) {
    centralFacilityModalClose.addEventListener('click', () => {
        centralFacilityModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close western facility modal when clicking X button
if (westernFacilityModalClose) {
    westernFacilityModalClose.addEventListener('click', () => {
        westernFacilityModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close Sunday-only facility modal when clicking X button
if (sundayOnlyModalClose) {
    sundayOnlyModalClose.addEventListener('click', () => {
        sundayOnlyModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close Otisville facility modal when clicking X button
if (otisvilleFacilityModalClose) {
    otisvilleFacilityModalClose.addEventListener('click', () => {
        otisvilleFacilityModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    });
}

// Close southern facility modal when clicking outside of it
if (facilityModal) {
    facilityModal.addEventListener('click', (e) => {
        if (e.target === facilityModal) {
            facilityModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}

// Close northern facility modal when clicking outside of it
if (northernFacilityModal) {
    northernFacilityModal.addEventListener('click', (e) => {
        if (e.target === northernFacilityModal) {
            northernFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}

// Close central facility modal when clicking outside of it
if (centralFacilityModal) {
    centralFacilityModal.addEventListener('click', (e) => {
        if (e.target === centralFacilityModal) {
            centralFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}

// Close western facility modal when clicking outside of it
if (westernFacilityModal) {
    westernFacilityModal.addEventListener('click', (e) => {
        if (e.target === westernFacilityModal) {
            westernFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}

// Close Sunday-only facility modal when clicking outside of it
if (sundayOnlyModal) {
    sundayOnlyModal.addEventListener('click', (e) => {
        if (e.target === sundayOnlyModal) {
            sundayOnlyModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}

// Close Otisville facility modal when clicking outside of it
if (otisvilleFacilityModal) {
    otisvilleFacilityModal.addEventListener('click', (e) => {
        if (e.target === otisvilleFacilityModal) {
            otisvilleFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    });
}


// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const colors = {
        success: '#059669',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        max-width: 400px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 6000);
}

// Animation on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.booking-form, .facility-card, .about-content');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Enhanced form interactions
function enhanceFormExperience() {
    // Auto-format phone number
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
            }
            e.target.value = value;
        });
    }
    
    // Restrict date picker to this weekend's bookable dates only
    const visitDateInput = document.getElementById('visit-date');
    if (visitDateInput) {
        const { satStr, sunStr } = getBookableWeekend();
        const minDate = satStr || sunStr;
        const maxDate = sunStr;

        visitDateInput.min = minDate;
        visitDateInput.max = maxDate;

        function validateDateInput() {
            const val = visitDateInput.value;
            if (val && val !== satStr && val !== sunStr) {
                visitDateInput.setCustomValidity('Only this weekend\'s dates are available for booking.');
                showFieldError('visit-date', 'Bookings are only accepted for this weekend. Please select an available date.');
            } else {
                visitDateInput.setCustomValidity('');
                const errorMessage = visitDateInput.parentNode.querySelector('.error-message');
                if (errorMessage) errorMessage.remove();
                visitDateInput.style.borderColor = 'rgba(129, 212, 217, 0.3)';
            }
        }

        visitDateInput.addEventListener('input', validateDateInput);
        visitDateInput.addEventListener('change', validateDateInput);
    }
    
    // Show temporary helper message
    function showTemporaryMessage(input, message) {
        // Remove existing message
        const existingMessage = input.parentNode.querySelector('.temp-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'temp-message';
        messageDiv.style.cssText = `
            color: #0DB7BB;
            font-size: 0.85rem;
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: rgba(13, 183, 187, 0.1);
            border-radius: 8px;
            border-left: 3px solid #0DB7BB;
        `;
        messageDiv.textContent = message;
        
        input.parentNode.appendChild(messageDiv);
        
        // Remove after 4 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
    }
    
    // Clear errors on input
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.style.borderColor = '#e5e7eb';
            const errorMessage = input.parentNode.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    });
}

// Initialize demo data
function initializeDemoData() {
    if (localStorage.getItem('wcf-bookings') === null) {
        const demoBookings = [
            {
                id: 'WCF-001234',
                name: 'Sarah Johnson',
                email: 'sarah.j@email.com',
                phone: '(555) 123-4567',
                facility: 'Clinton Correctional Facility',
                'visit-date': '2025-09-25',
                visitors: '2',
                notifications: 'sms',
                status: 'confirmed',
                timestamp: new Date(Date.now() - 86400000).toISOString() // Yesterday
            },
            {
                id: 'WCF-001235',
                name: 'Michael Rodriguez',
                email: 'mrod@email.com',
                phone: '(555) 987-6543',
                facility: 'Washington Correctional Facility',
                'visit-date': '2025-09-22',
                visitors: '1',
                notifications: 'email',
                status: 'checked-in',
                timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
                id: 'WCF-001236',
                name: 'Jennifer Chen',
                email: 'jchen@email.com',
                phone: '(555) 456-7890',
                facility: 'Coxsackie Correctional Facility',
                'visit-date': '2025-09-28',
                visitors: '3',
                notifications: 'sms',
                status: 'confirmed',
                timestamp: new Date().toISOString() // Today
            }
        ];
        
        localStorage.setItem('wcf-bookings', JSON.stringify(demoBookings));
    }
}

// Pickup locations data based on facilities
const pickupLocationData = {
    // Group 1 - Early Morning Pickups (12:30am-1:45am): Auburn, Cayuga, Elmira, Five Points, Marcy, Mid-State, Mohawk
    'Auburn Correctional Facility': [
        { name: 'Brooklyn: Eastern Pkwy McDonald\'s', time: '12:30 AM', address: '1133 Eastern Pkwy, Brooklyn, NY 11213', value: 'brooklyn-eastern' },
        { name: 'Brooklyn: Broadway Junction', time: '12:45 AM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Sutphin Blvd Chase Bank', time: '1:00 AM', address: '9059 Sutphin Blvd, Jamaica, NY 11435', value: 'queens-sutphin' },
        { name: 'Queens: Astoria Neptune Diner', time: '1:20 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '1:30 AM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '1:45 AM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Cayuga Correctional Facility': [
        { name: 'Brooklyn: Eastern Pkwy McDonald\'s', time: '12:30 AM', address: '1133 Eastern Pkwy, Brooklyn, NY 11213', value: 'brooklyn-eastern' },
        { name: 'Brooklyn: Broadway Junction', time: '12:45 AM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Sutphin Blvd Chase Bank', time: '1:00 AM', address: '9059 Sutphin Blvd, Jamaica, NY 11435', value: 'queens-sutphin' },
        { name: 'Queens: Astoria Neptune Diner', time: '1:20 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '1:30 AM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '1:45 AM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Elmira Correctional Facility': [
        { name: 'Brooklyn: Eastern Pkwy McDonald\'s', time: '12:30 AM', address: '1133 Eastern Pkwy, Brooklyn, NY 11213', value: 'brooklyn-eastern' },
        { name: 'Brooklyn: Broadway Junction', time: '12:45 AM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Sutphin Blvd Chase Bank', time: '1:00 AM', address: '9059 Sutphin Blvd, Jamaica, NY 11435', value: 'queens-sutphin' },
        { name: 'Queens: Astoria Neptune Diner', time: '1:20 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '1:30 AM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '1:45 AM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Five Points Correctional Facility': [
        { name: 'Brooklyn: Eastern Pkwy McDonald\'s', time: '12:30 AM', address: '1133 Eastern Pkwy, Brooklyn, NY 11213', value: 'brooklyn-eastern' },
        { name: 'Brooklyn: Broadway Junction', time: '12:45 AM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Sutphin Blvd Chase Bank', time: '1:00 AM', address: '9059 Sutphin Blvd, Jamaica, NY 11435', value: 'queens-sutphin' },
        { name: 'Queens: Astoria Neptune Diner', time: '1:20 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '1:30 AM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '1:45 AM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Marcy Correctional Facility': [
        { name: 'Brooklyn: Flatbush Ave Apple Store', time: '1:45 AM', address: '123 Flatbush Ave, Brooklyn, NY 11217', value: 'brooklyn-flatbush' },
        { name: 'Queens: Astoria Neptune Diner', time: '2:00 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Bronx: Grand Concourse Chipotle', time: '2:15 AM', address: '557 Grand Concourse, Bronx, NY 10451', value: 'bronx-chipotle' }
    ],
    'Mid-State Correctional Facility': [
        { name: 'Brooklyn: Flatbush Ave Apple Store', time: '1:45 AM', address: '123 Flatbush Ave, Brooklyn, NY 11217', value: 'brooklyn-flatbush' },
        { name: 'Queens: Astoria Neptune Diner', time: '2:00 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Bronx: Grand Concourse Chipotle', time: '2:15 AM', address: '557 Grand Concourse, Bronx, NY 10451', value: 'bronx-chipotle' }
    ],
    'Mohawk Correctional Facility': [
        { name: 'Brooklyn: Flatbush Ave Apple Store', time: '1:45 AM', address: '123 Flatbush Ave, Brooklyn, NY 11217', value: 'brooklyn-flatbush' },
        { name: 'Queens: Astoria Neptune Diner', time: '2:00 AM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Bronx: Grand Concourse Chipotle', time: '2:15 AM', address: '557 Grand Concourse, Bronx, NY 10451', value: 'bronx-chipotle' }
    ],

    // Group 2 - Late Evening Pickups (10:30pm-11:30pm): Attica, Groveland, Wende, Wyoming, Orleans
    'Attica Correctional Facility': [
        { name: 'Brooklyn: Broadway Junction', time: '10:30 PM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Astoria Neptune Diner', time: '11:00 PM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '11:15 PM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '11:30 PM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Groveland Correctional Facility': [
        { name: 'Brooklyn: Broadway Junction', time: '10:30 PM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Astoria Neptune Diner', time: '11:00 PM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '11:15 PM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '11:30 PM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Wende Correctional Facility': [
        { name: 'Brooklyn: Broadway Junction', time: '10:30 PM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Astoria Neptune Diner', time: '11:00 PM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '11:15 PM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '11:30 PM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Wyoming Correctional Facility': [
        { name: 'Brooklyn: Broadway Junction', time: '10:30 PM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Astoria Neptune Diner', time: '11:00 PM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '11:15 PM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '11:30 PM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ],
    'Orleans Correctional Facility': [
        { name: 'Brooklyn: Broadway Junction', time: '10:30 PM', address: '2399 Fulton St, Brooklyn, NY 11233', value: 'brooklyn-broadway' },
        { name: 'Queens: Astoria Neptune Diner', time: '11:00 PM', address: '3105 Astoria Blvd N, Astoria, NY 11102', value: 'queens-astoria' },
        { name: 'Manhattan: 125th St Taco Bell', time: '11:15 PM', address: '161 E 125th St, New York, NY 10035', value: 'manhattan-125' },
        { name: 'Bronx: Grand Concourse Hostos College', time: '11:30 PM', address: '500 Grand Concourse, Bronx, NY 10451', value: 'bronx-concourse' }
    ]
};

// Function to update pickup locations based on selected facility
function updatePickupLocations() {
    const facilitySelect = document.getElementById('facility');
    const pickupLocationSelect = document.getElementById('pickup-location');
    const pickupTimeInfo = document.getElementById('pickup-time-info');
    
    if (!facilitySelect || !pickupLocationSelect || !pickupTimeInfo) return;
    
    const selectedFacility = facilitySelect.value;
    
    if (!selectedFacility) {
        pickupLocationSelect.disabled = true;
        pickupLocationSelect.innerHTML = '<option value="">First select a facility above...</option>';
        pickupTimeInfo.innerHTML = '<p class="pickup-time-text">Select a facility to see available pickup locations and times</p>';
        return;
    }
    
    const locations = pickupLocationData[selectedFacility] || [];
    
    // Clear and populate pickup location dropdown
    pickupLocationSelect.innerHTML = '<option value="">Choose pickup location...</option>';
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location.value;
        option.textContent = `${location.name} - ${location.time}`;
        pickupLocationSelect.appendChild(option);
    });
    
    // Enable the dropdown
    pickupLocationSelect.disabled = false;
    
    // Update the time info display
    if (locations.length > 0) {
        let infoHTML = '<div class="pickup-locations-list">';
        infoHTML += '<h4 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 1rem;">Available Pickup Locations & Times:</h4>';
        infoHTML += '<p style="margin: 0 0 1rem 0; color: #6b7280; font-size: 0.9rem; font-style: italic;">ℹ️ For reference only - select your pickup location using the dropdown above</p>';
        
        locations.forEach(location => {
            infoHTML += `
                <div class="pickup-location-item">
                    <div>
                        <div class="pickup-location-name">${location.name}</div>
                        <div class="pickup-location-address">📍 ${location.address}</div>
                        ${location.note ? `<div style="color: #f59e0b; font-weight: 600; font-size: 0.8rem; margin-top: 0.25rem;">⚠️ ${location.note}</div>` : ''}
                    </div>
                    <div class="pickup-location-time">${location.time}</div>
                </div>
            `;
        });
        
        infoHTML += '</div>';
        pickupTimeInfo.innerHTML = infoHTML;
    } else {
        pickupTimeInfo.innerHTML = '<p class="pickup-time-text">No pickup locations available for this facility. Please contact us.</p>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDemoData();
    enhanceFormExperience();
    animateOnScroll();

    // Set up facility change listener for pickup locations
    const facilitySelect = document.getElementById('facility');
    if (facilitySelect) {
        facilitySelect.addEventListener('change', updatePickupLocations);
    }

    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.type === 'submit') {
                return;
            }
        });
    });

    // Add "View Pickup Times" button to every facility card that has pickup data
    document.querySelectorAll('.facility-card').forEach(card => {
        const name = card.querySelector('h3')?.textContent?.trim();
        if (name && pickupLocationData[name]) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'facility-details-btn';
            btn.textContent = 'View Pickup Times';
            btn.onclick = () => openFacilityModal(name);
            card.querySelector('.facility-info')?.appendChild(btn);
        }
    });
});

// ===========================================
// BOOKING SUCCESS SCREEN
// ===========================================
function showBookingSuccess(bookingId, bookingData, priceInfo) {
    document.getElementById('success-booking-id').textContent = '#' + bookingId;

    const formatDate = dateStr => {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const locs = pickupLocationData[bookingData.facility] || [];
    const loc = locs.find(l => l.value === bookingData.pickup_location);
    const pickupDisplay = loc ? `${loc.name} @ ${loc.time}` : bookingData.pickup_location;

    const adults = parseInt(bookingData.adults) || 0;
    const children = parseInt(bookingData.children) || 0;
    const passengerText = `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? ` + ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;

    document.getElementById('success-summary').innerHTML = `
        <div class="summary-row"><span>Facility</span><span>${bookingData.facility}</span></div>
        <div class="summary-row"><span>Visit Date</span><span>${formatDate(bookingData.visit_date)}</span></div>
        <div class="summary-row"><span>Pickup</span><span>${pickupDisplay}</span></div>
        <div class="summary-row"><span>Passengers</span><span>${passengerText}</span></div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-deposit"><span>Deposit Paid</span><span>$${priceInfo.depositAmount}.00 ✓</span></div>
        <div class="summary-row summary-balance"><span>Balance Due on Trip</span><span>$${priceInfo.balanceDue}.00</span></div>
    `;

    document.querySelector('.booking-wrapper').style.display = 'none';
    document.getElementById('booking-success-screen').style.display = 'block';
    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
}

function resetBookingForm() {
    document.getElementById('booking-success-screen').style.display = 'none';
    document.querySelector('.booking-wrapper').style.display = 'grid';
    const docsSection = document.getElementById('children-docs-section');
    const docsConsent = document.getElementById('children-docs-consent');
    if (docsSection) docsSection.style.display = 'none';
    if (docsConsent) { docsConsent.checked = false; docsConsent.required = false; }
    document.getElementById('book').scrollIntoView({ behavior: 'smooth' });
}

// ===========================================
// DYNAMIC FACILITY DETAIL MODAL
// ===========================================
function openFacilityModal(facilityName) {
    const locations = pickupLocationData[facilityName];
    if (!locations || !locations.length) return;

    document.getElementById('fmodal-header').innerHTML = `
        <h3>${facilityName}</h3>
        <p class="travel-days">Weekend service — Saturday &amp; Sunday</p>
        <p class="thank-you">Please arrive at your pickup location on time. <strong>There are no grace periods.</strong></p>
    `;

    let locHTML = '<h4>📍 PICKUP LOCATIONS &amp; TIMES</h4>';
    locations.forEach(loc => {
        locHTML += `
            <div class="location-item">
                <div class="location-header" style="justify-content:space-between;">
                    <strong>${loc.name}</strong>
                    <span class="pickup-location-time">${loc.time}</span>
                </div>
                <p class="address">📍 ${loc.address}</p>
            </div>
        `;
    });
    document.getElementById('fmodal-locations').innerHTML = locHTML;

    const last = locations[locations.length - 1];
    document.getElementById('fmodal-boarding').innerHTML = `
        <h4>🚨 FINAL BOARDING: ${last.name.toUpperCase()} @ ${last.time}</h4>
        <p><strong>THERE ARE NO GRACE PERIODS. PLEASE BE ON TIME AND READY FOR YOUR TRIP.</strong></p>
    `;

    document.getElementById('facility-detail-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close facility detail modal
document.getElementById('facility-detail-close')?.addEventListener('click', () => {
    document.getElementById('facility-detail-modal').style.display = 'none';
    document.body.style.overflow = '';
});
window.addEventListener('click', e => {
    if (e.target === document.getElementById('facility-detail-modal')) {
        document.getElementById('facility-detail-modal').style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        if (facilityModal && facilityModal.style.display === 'block') {
            facilityModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (northernFacilityModal && northernFacilityModal.style.display === 'block') {
            northernFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (centralFacilityModal && centralFacilityModal.style.display === 'block') {
            centralFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        if (westernFacilityModal && westernFacilityModal.style.display === 'block') {
            westernFacilityModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
});

// Performance optimization
function optimizePerformance() {
    // Lazy load images if any are added later
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Debounce scroll events
    let scrollTimer;
    const originalScrollHandler = window.onscroll;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            if (originalScrollHandler) originalScrollHandler();
        }, 10);
    });
}

// Federal Holiday Checker
function isFederalHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();
    
    // List of federal holidays that don't change dates
    const fixedHolidays = [
        { month: 0, day: 1 },   // New Year's Day
        { month: 6, day: 4 },   // Independence Day
        { month: 10, day: 11 }, // Veterans Day
        { month: 11, day: 25 }  // Christmas Day
    ];
    
    // Check fixed holidays
    for (const holiday of fixedHolidays) {
        if (month === holiday.month && day === holiday.day) {
            return true;
        }
    }
    
    // Martin Luther King Jr. Day (3rd Monday in January)
    if (month === 0 && isNthWeekdayOfMonth(date, 1, 3)) {
        return true;
    }
    
    // Presidents Day (3rd Monday in February)
    if (month === 1 && isNthWeekdayOfMonth(date, 1, 3)) {
        return true;
    }
    
    // Memorial Day (Last Monday in May)
    if (month === 4 && isLastWeekdayOfMonth(date, 1)) {
        return true;
    }
    
    // Labor Day (1st Monday in September)
    if (month === 8 && isNthWeekdayOfMonth(date, 1, 1)) {
        return true;
    }
    
    // Columbus Day (2nd Monday in October)
    if (month === 9 && isNthWeekdayOfMonth(date, 1, 2)) {
        return true;
    }
    
    // Thanksgiving (4th Thursday in November)
    if (month === 10 && isNthWeekdayOfMonth(date, 4, 4)) {
        return true;
    }
    
    return false;
}

// Helper function to check if date is nth weekday of month
function isNthWeekdayOfMonth(date, weekday, nth) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    
    let daysToAdd = weekday - firstWeekday;
    if (daysToAdd < 0) daysToAdd += 7;
    
    const nthWeekdayDate = 1 + daysToAdd + (nth - 1) * 7;
    return date.getDate() === nthWeekdayDate;
}

// Helper function to check if date is last weekday of month
function isLastWeekdayOfMonth(date, weekday) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    
    let daysToSubtract = lastWeekday - weekday;
    if (daysToSubtract < 0) daysToSubtract += 7;
    
    const lastWeekdayDate = lastDay.getDate() - daysToSubtract;
    return date.getDate() === lastWeekdayDate;
}

// Initialize performance optimizations
optimizePerformance();

// ==========================================
// ADMIN SYSTEM
// ==========================================

// Hub definitions
const HUB_FACILITIES = {
    '1': ['Auburn Correctional Facility', 'Cayuga Correctional Facility', 'Five Points Correctional Facility', 'Elmira Correctional Facility'],
    '2': ['Attica Correctional Facility', 'Groveland Correctional Facility', 'Wende Correctional Facility', 'Wyoming Correctional Facility', 'Orleans Correctional Facility'],
    '3': ['Marcy Correctional Facility', 'Mid-State Correctional Facility', 'Mohawk Correctional Facility']
};

// Admin state
let adminState = {
    isLoggedIn: false,
    sessionToken: null,
    bookings: [],
    currentFilter: 'all',
    currentHub: 'all',
    currentDay: 'all'
};

// Admin DOM elements
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminLoginClose = document.querySelector('.admin-login-close');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginError = document.getElementById('admin-login-error');
const adminDashboardModal = document.getElementById('admin-dashboard-modal');
const bookingActionModal = document.getElementById('booking-action-modal');

// Admin event listeners
adminLoginBtn?.addEventListener('click', showAdminLoginModal);
adminLoginClose?.addEventListener('click', hideAdminLoginModal);
adminLoginForm?.addEventListener('submit', handleAdminLogin);

// Print and refresh button listeners
document.getElementById('print-bookings')?.addEventListener('click', handlePrintBookings);
document.getElementById('refresh-bookings')?.addEventListener('click', handleRefreshBookings);

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleFilterChange);
});

// Hub filter dropdown
document.getElementById('hub-filter-select')?.addEventListener('change', handleHubFilterChange);

// Day filter buttons
document.querySelectorAll('.day-filter-btn').forEach(btn => {
    btn.addEventListener('click', handleDayFilterChange);
});

// Admin action buttons
document.getElementById('admin-logout')?.addEventListener('click', handleAdminLogout);
document.getElementById('refresh-bookings')?.addEventListener('click', loadBookings);

// Booking action modal
document.querySelector('.booking-action-close')?.addEventListener('click', hideBookingActionModal);
document.getElementById('cancel-action')?.addEventListener('click', hideBookingActionModal);
document.getElementById('confirm-action')?.addEventListener('click', handleBookingAction);

// API Configuration
const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:3333' 
    : window.location.origin;

// Show admin login modal
function showAdminLoginModal() {
    adminLoginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('admin-password').focus();
}

// Hide admin login modal
function hideAdminLoginModal() {
    adminLoginModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    adminLoginForm.reset();
    hideError(adminLoginError);
}

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('admin-password').value;
    const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    hideError(adminLoginError);
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Login successful
            adminState.isLoggedIn = true;
            adminState.sessionToken = data.sessionToken;

            // Hide login modal
            hideAdminLoginModal();

            // Show dashboard with loading state
            showAdminDashboard();

            // Load bookings and stats BEFORE removing loading spinner
            try {
                await Promise.all([loadBookings(), loadStats()]);
                showNotification('✅ Admin login successful!', 'success');
            } catch (error) {
                console.error('Failed to load admin data:', error);
                showNotification('⚠️ Logged in, but failed to load bookings. Please refresh.', 'warning');
            }
        } else {
            // Login failed
            showError(adminLoginError, data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(adminLoginError, 'Connection error. Please try again.');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

// Show admin dashboard
function showAdminDashboard() {
    adminDashboardModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Hide admin dashboard
function hideAdminDashboard() {
    adminDashboardModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle admin logout
async function handleAdminLogout() {
    try {
        await fetch(`${API_BASE}/api/admin/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminState.sessionToken}`,
                'Content-Type': 'application/json',
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear admin state
    adminState.isLoggedIn = false;
    adminState.sessionToken = null;
    adminState.bookings = [];
    
    // Hide dashboard
    hideAdminDashboard();
    
    showNotification('👋 Logged out successfully', 'info');
}

// Load bookings from API with retry
async function loadBookings(retryCount = 0) {
    if (!adminState.sessionToken) return;

    const loadingSpinner = document.getElementById('admin-loading');
    const bookingsContainer = document.getElementById('bookings-container');

    if (loadingSpinner) loadingSpinner.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/api/admin/bookings`, {
            headers: {
                'Authorization': `Bearer ${adminState.sessionToken}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            adminState.bookings = data.bookings;
            window.currentBookings = data.bookings; // Store for printing
            displayBookings(data.bookings);
            updateStats(data.counts);
            console.log(`✅ Loaded ${data.bookings.length} bookings successfully`);
        } else {
            throw new Error(data.error || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('Load bookings error:', error);

        // Retry up to 2 times with exponential backoff
        if (retryCount < 2) {
            console.log(`🔄 Retrying... (attempt ${retryCount + 1}/2)`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return loadBookings(retryCount + 1);
        }

        bookingsContainer.innerHTML = `
            <div class="no-bookings">
                <h3>Error Loading Bookings</h3>
                <p>${error.message}</p>
                <button onclick="loadBookings()" class="btn btn-primary" style="margin-top: 1rem;">Retry</button>
            </div>`;
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Load statistics
async function loadStats() {
    if (!adminState.sessionToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${adminState.sessionToken}`,
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            updateStats(data.stats);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// Update statistics display
function updateStats(stats) {
    const statElements = {
        'stat-total': stats.total || 0,
        'stat-pending': stats.pending || 0,
        'stat-confirmed': stats.confirmed || 0
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Display bookings
function displayBookings(bookings) {
    const container = document.getElementById('bookings-container');

    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings">
                <h3>No bookings found</h3>
                <p>When customers make bookings, they will appear here.</p>
            </div>
        `;
        return;
    }

    // Filter bookings based on current status filter
    let filteredBookings = bookings;
    if (adminState.currentFilter !== 'all') {
        if (adminState.currentFilter === 'checked-in') {
            // Show only bookings that have checked in
            filteredBookings = bookings.filter(booking => booking.checked_in_at);
        } else {
            filteredBookings = bookings.filter(booking => booking.status === adminState.currentFilter);
        }
    }

    // Filter by hub
    if (adminState.currentHub !== 'all') {
        const hubFacilities = HUB_FACILITIES[adminState.currentHub] || [];
        filteredBookings = filteredBookings.filter(booking => hubFacilities.includes(booking.facility));
    }

    // Filter by day (Saturday or Sunday)
    if (adminState.currentDay !== 'all') {
        filteredBookings = filteredBookings.filter(booking => {
            if (!booking.visit_date) return false;
            const date = new Date(booking.visit_date + 'T00:00:00');
            const dow = date.getDay();
            if (adminState.currentDay === 'saturday') return dow === 6;
            if (adminState.currentDay === 'sunday') return dow === 0;
            return true;
        });
    }

    if (filteredBookings.length === 0) {
        const filterText = `${adminState.currentFilter} bookings`;
        container.innerHTML = `
            <div class="no-bookings">
                <h3>No ${filterText}</h3>
                <p>Try selecting a different filter.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredBookings.map(booking => `
        <div class="booking-item" data-booking-id="${booking.id}">
            <div class="booking-header">
                <div class="booking-info">
                    <h4>${booking.name}</h4>
                    <p>📞 ${booking.phone} ${booking.email ? `• 📧 ${booking.email}` : ''}</p>
                    <p>📅 Booked: ${formatDate(booking.created_at)}</p>
                </div>
                <div class="booking-header-actions">
                    <span class="booking-status status-${booking.status}">${booking.status}</span>
                    <button class="delete-booking-btn" data-booking-id="${booking.id}" data-booking-name="${booking.name}" title="Delete booking">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div class="booking-details">
                <div class="detail-item">
                    <span class="detail-icon">🏢</span>
                    <span class="detail-text">${booking.facility}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">🚐</span>
                    <span class="detail-text"><strong>Visit Date:</strong> ${formatDate(booking.visit_date)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">📍</span>
                    <span class="detail-text">${booking.pickup_location}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">👥</span>
                    <span class="detail-text">${
                        booking.adults ?
                        `${booking.adults} Adult(s)${(booking.children && booking.children > 0) ? `, ${booking.children} Child(ren)` : ''}` :
                        `${booking.guests || 1} guest(s)`
                    }</span>
                </div>
                ${booking.payment_status ? `
                <div class="detail-item">
                    <span class="detail-icon">💳</span>
                    <span class="detail-text">
                        <strong>Payment:</strong>
                        ${booking.payment_status === 'succeeded' ?
                            `<span style="color: #28a745;">✅ Paid $${(booking.payment_amount / 100).toFixed(2)}</span>` :
                            `<span style="color: #ffc107;">${booking.payment_status}</span>`
                        }
                    </span>
                </div>
                ` : ''}
            </div>
            
            ${booking.status === 'pending' ? `
                <div class="booking-actions">
                    <button class="confirm-booking-btn" onclick="showBookingActionModal(${booking.id}, 'confirm')">
                        ✅ Confirm Booking
                    </button>
                    <button class="reject-booking-btn" onclick="showBookingActionModal(${booking.id}, 'reject')">
                        ❌ Reject Booking
                    </button>
                </div>
            ` : ''}
            
            ${booking.confirmed_at ? `
                <p style="color: #28a745; font-size: 0.9rem; margin-top: 0.5rem;">
                    ✅ Confirmed: ${formatDate(booking.confirmed_at)}
                </p>
            ` : ''}

            ${booking.checked_in_at ? `
                <p style="color: #007bff; font-size: 0.9rem; margin-top: 0.5rem; font-weight: bold;">
                    ✅ Checked In: ${formatDate(booking.checked_in_at)}
                </p>
            ` : ''}

            ${booking.notes ? `
                <p style="color: #6c757d; font-size: 0.9rem; margin-top: 0.5rem;">
                    📝 Notes: ${booking.notes}
                </p>
            ` : ''}
        </div>
    `).join('');

    // Add event listeners to all delete buttons
    document.querySelectorAll('.delete-booking-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookingId = e.currentTarget.dataset.bookingId;
            const bookingName = e.currentTarget.dataset.bookingName;
            showDeleteConfirmation(bookingId, bookingName);
        });
    });
}

// Handle filter changes
function handleFilterChange(e) {
    const status = e.target.dataset.status;
    adminState.currentFilter = status;

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // Re-display bookings with new filter
    displayBookings(adminState.bookings);
}

// Handle hub filter changes
function handleHubFilterChange(e) {
    adminState.currentHub = e.target.value;
    displayBookings(adminState.bookings);
}

// Handle day filter changes
function handleDayFilterChange(e) {
    adminState.currentDay = e.target.dataset.day;
    document.querySelectorAll('.day-filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    displayBookings(adminState.bookings);
}

// Show booking action modal
function showBookingActionModal(bookingId, action) {
    const booking = adminState.bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modal = bookingActionModal;
    const title = document.getElementById('action-title');
    const details = document.getElementById('action-booking-details');
    const reasonSection = document.getElementById('rejection-reason');
    const confirmBtn = document.getElementById('confirm-action');
    
    // Set modal content based on action
    if (action === 'confirm') {
        title.textContent = 'Confirm Booking';
        confirmBtn.textContent = 'Confirm Booking';
        confirmBtn.className = 'confirm-btn';
        reasonSection.style.display = 'none';
    } else {
        title.textContent = 'Reject Booking';
        confirmBtn.textContent = 'Reject Booking';
        confirmBtn.className = 'confirm-btn reject';
        reasonSection.style.display = 'block';
    }
    
    // Show booking details
    details.innerHTML = `
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p><strong>Customer:</strong> ${booking.name}</p>
            <p><strong>Phone:</strong> ${booking.phone}</p>
            ${booking.email ? `<p><strong>Email:</strong> ${booking.email}</p>` : ''}
            <p><strong>Facility:</strong> ${booking.facility}</p>
            <p><strong>Visit Date:</strong> ${formatDate(booking.visit_date)}</p>
            <p><strong>Pickup:</strong> ${booking.pickup_location}</p>
            <p><strong>Guests:</strong> ${booking.guests}</p>
        </div>
    `;
    
    // Store booking ID and action for later use
    confirmBtn.dataset.bookingId = bookingId;
    confirmBtn.dataset.action = action;
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Hide booking action modal
function hideBookingActionModal() {
    bookingActionModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('rejection-reason-input').value = '';
}

// Handle booking action (confirm/reject)
async function handleBookingAction() {
    const confirmBtn = document.getElementById('confirm-action');
    const bookingId = confirmBtn.dataset.bookingId;
    const action = confirmBtn.dataset.action;
    const reason = document.getElementById('rejection-reason-input').value.trim();
    
    if (!bookingId || !action) return;
    
    // Show loading state
    confirmBtn.disabled = true;
    confirmBtn.textContent = action === 'confirm' ? 'Confirming...' : 'Rejecting...';
    
    try {
        const endpoint = `${API_BASE}/api/admin/bookings/${bookingId}/${action}`;
        const body = action === 'reject' && reason ? { reason } : {};
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminState.sessionToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Success
            showNotification(data.message, 'success');
            
            // Log notification results
            if (data.notifications) {
                if (data.notifications.sms?.success) {
                    console.log('📱 SMS sent successfully');
                }
                if (data.notifications.email?.success) {
                    console.log('📧 Email sent successfully');
                }
            }
            
            // Refresh bookings
            await loadBookings();
            await loadStats();
            
            // Hide modal
            hideBookingActionModal();
        } else {
            throw new Error(data.error || `Failed to ${action} booking`);
        }
    } catch (error) {
        console.error(`${action} booking error:`, error);
        showNotification(`Failed to ${action} booking: ${error.message}`, 'error');
    } finally {
        // Reset button
        confirmBtn.disabled = false;
        confirmBtn.textContent = action === 'confirm' ? 'Confirm Booking' : 'Reject Booking';
    }
}

// Delete booking functions
let deleteBookingId = null;

function showDeleteConfirmation(bookingId, bookingName) {
    deleteBookingId = bookingId;

    const modal = document.getElementById('delete-confirmation-modal');
    const details = document.getElementById('delete-booking-details');

    details.textContent = `Are you sure you want to delete the booking for "${bookingName}"?`;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideDeleteConfirmation() {
    const modal = document.getElementById('delete-confirmation-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    deleteBookingId = null;
}

async function handleDeleteBooking() {
    if (!deleteBookingId) {
        console.error('No booking ID to delete');
        return;
    }

    console.log('🗑️ Delete booking called for ID:', deleteBookingId);
    console.log('API_BASE:', API_BASE);
    console.log('Session token:', adminState.sessionToken ? 'Present' : 'Missing');

    const confirmBtn = document.getElementById('confirm-delete');
    const originalText = confirmBtn.textContent;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
        const url = `${API_BASE}/api/admin/bookings/${deleteBookingId}`;
        console.log('DELETE request to:', url);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminState.sessionToken}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
            showNotification('🗑️ Booking deleted successfully', 'success');

            // Refresh bookings
            await loadBookings();
            await loadStats();

            // Hide modal
            hideDeleteConfirmation();
        } else {
            throw new Error(data.error || 'Failed to delete booking');
        }
    } catch (error) {
        console.error('Delete booking error:', error);
        showNotification(`Failed to delete booking: ${error.message}`, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Add event listeners for delete modal
document.querySelector('.delete-confirmation-close')?.addEventListener('click', hideDeleteConfirmation);
document.getElementById('cancel-delete')?.addEventListener('click', hideDeleteConfirmation);
document.getElementById('confirm-delete')?.addEventListener('click', handleDeleteBooking);

// Utility functions
function formatDate(dateString) {
    // For visit dates (YYYY-MM-DD format), avoid timezone issues
    if (dateString && dateString.includes('-') && !dateString.includes('T')) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    // For timestamps with time
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(element) {
    if (element) {
        element.style.display = 'none';
    }
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === adminLoginModal) {
        hideAdminLoginModal();
    }
    if (e.target === adminDashboardModal) {
        // Don't close dashboard when clicking outside - user should use logout button
    }
    if (e.target === bookingActionModal) {
        hideBookingActionModal();
    }
});

// Old database handler removed - now using payment-enabled handler at top of file

// Get currently filtered bookings (respects status and date filters)
// This uses the SAME logic as displayBookings() to ensure consistency
function getFilteredBookings() {
    let bookings = adminState.bookings || [];
    let filteredBookings = bookings;

    // Filter by status (pending, confirmed, rejected, checked-in)
    if (adminState.currentFilter !== 'all') {
        if (adminState.currentFilter === 'checked-in') {
            filteredBookings = bookings.filter(booking => booking.checked_in_at);
        } else {
            filteredBookings = bookings.filter(booking => booking.status === adminState.currentFilter);
        }
    }

    // Filter by hub
    if (adminState.currentHub !== 'all') {
        const hubFacilities = HUB_FACILITIES[adminState.currentHub] || [];
        filteredBookings = filteredBookings.filter(booking => hubFacilities.includes(booking.facility));
    }

    // Filter by day (Saturday or Sunday)
    if (adminState.currentDay !== 'all') {
        filteredBookings = filteredBookings.filter(booking => {
            if (!booking.visit_date) return false;
            const date = new Date(booking.visit_date + 'T00:00:00');
            const dow = date.getDay();
            if (adminState.currentDay === 'saturday') return dow === 6;
            if (adminState.currentDay === 'sunday') return dow === 0;
            return true;
        });
    }

    return filteredBookings;
}

// Print bookings function - now respects current filters
function handlePrintBookings() {
    console.log('🖨️ Print button clicked');
    console.log('Current filters:', { status: adminState.currentFilter, hub: adminState.currentHub, day: adminState.currentDay });
    console.log('Total bookings in adminState:', adminState.bookings.length);

    const bookings = getFilteredBookings();
    console.log('Filtered bookings to print:', bookings.length);

    if (!bookings || bookings.length === 0) {
        alert('No bookings to print with the current filters. Try changing your filter selection.');
        return;
    }

    // Create Google Docs compatible template
    const printContent = generatePrintTemplate(bookings);

    // Create new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function generatePrintTemplate(bookings) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>WE Connect Families - Booking Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .booking { border: 1px solid #ddd; margin: 15px 0; padding: 15px; page-break-inside: avoid; }
            .booking-header { font-weight: bold; color: #2c5aa0; margin-bottom: 10px; }
            .detail { margin: 5px 0; }
            .status { padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-confirmed { background: #d4edda; color: #155724; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚌 JCXPRESS</h1>
            <h2>Transportation Booking Report</h2>
            <p>Generated on: ${currentDate}</p>
            <p>Total Bookings: ${bookings.length}</p>
        </div>
    `;
    
    bookings.forEach((booking, index) => {
        html += `
        <div class="booking">
            <div class="booking-header">Booking #${booking.id} - ${booking.name}</div>
            <div class="detail"><strong>Phone:</strong> ${booking.phone}</div>
            ${booking.email ? `<div class="detail"><strong>Email:</strong> ${booking.email}</div>` : ''}
            <div class="detail"><strong>Facility:</strong> ${booking.facility}</div>
            <div class="detail"><strong>Visit Date:</strong> ${formatDate(booking.visit_date)}</div>
            <div class="detail"><strong>Pickup Location:</strong> ${booking.pickup_location}</div>
            <div class="detail"><strong>Visitors:</strong> ${booking.visitors || booking.guests}</div>
            <div class="detail"><strong>Status:</strong> <span class="status status-${booking.status}">${booking.status.toUpperCase()}</span></div>
            <div class="detail"><strong>Booked:</strong> ${formatDate(booking.created_at)}</div>
            ${booking.notes ? `<div class="detail"><strong>Notes:</strong> ${booking.notes}</div>` : ''}
        </div>
        `;
    });
    
    html += `
        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>© JCXPRESS Transportation Services</p>
        </div>
    </body>
    </html>
    `;
    
    return html;
}

// Refresh bookings from server
function handleRefreshBookings() {
    loadBookings();
}

function getCurrentBookings() {
    // Get bookings from the global variable if available
    if (window.currentBookings) {
        return window.currentBookings;
    }
    return [];
}

console.log('🔐 Admin system initialized');
console.log('📊 Database integration ready');
console.log('🚀 WE Connect Families booking system loaded');