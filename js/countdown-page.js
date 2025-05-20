// This handles the countdown display page
// Shows the flip animation and manages a specific countdown

// DOM Elements
const eventTitle = document.getElementById('event-title');
const resetButton = document.getElementById('reset-btn');
const shareButton = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const closeModalButton = document.getElementById('close-modal');
const shareLinkInput = document.getElementById('share-link');
const copyLinkButton = document.getElementById('copy-link');
const countdownContainer = document.getElementById('countdown-container');

// Countdown controller
let countdownController = null;
let currentCountdown = null;

// When the page loads
document.addEventListener('DOMContentLoaded', function() {
  loadCountdownFromUrl();
  setupEventListeners();
});

// Gets countdown info from the URL
function loadCountdownFromUrl() {
  // Parse URL parameters
  const urlData = ShareManager.parseCountdownFromUrl();

  if (!urlData) {
    // No valid parameters, redirect to home
    window.location.href = 'index.html';
    return;
  }

  if (urlData.id) {
    // Load countdown by ID
    const countdown = StorageManager.getCountdownById(urlData.id);

    if (countdown) {
      // Found in localStorage
      initializeCountdown(countdown);
    } else {
      // ID not found, check for direct parameters
      const name = new URLSearchParams(window.location.search).get('name');
      const date = new URLSearchParams(window.location.search).get('date');

      if (name && date) {
        // Create new countdown from parameters
        const newCountdown = {
          name,
          targetDate: date,
          theme: new URLSearchParams(window.location.search).get('theme') || 'default'
        };

        // Save and initialize
        const id = StorageManager.saveCountdown(newCountdown);
        newCountdown.id = id;
        initializeCountdown(newCountdown);
      } else {
        // No valid data, redirect to home
        window.location.href = 'index.html';
      }
    }
  } else if (urlData.name && urlData.targetDate) {
    // Direct parameters provided
    initializeCountdown(urlData);
  } else {
    // No valid data, redirect to home
    window.location.href = 'index.html';
  }
}

// Sets up the countdown with the data we got
function initializeCountdown(countdown) {
  currentCountdown = countdown;

  // Set page title
  document.title = `Countdown to ${countdown.name}`;

  // Set event title (limit length to avoid overflow)
  const displayName = countdown.name.length > 25 ? countdown.name.substring(0, 25) + '...' : countdown.name;
  eventTitle.textContent = `Countdown to ${displayName}`;

  // Apply theme if specified
  if (countdown.theme && countdown.theme !== 'default') {
    applyTheme(countdown.theme);
  }

  // Initialize countdown elements
  setupCountdownElements();

  // Create and start countdown
  countdownController = CountdownManager.createCountdown({
    daysElement: 'days-box',
    hoursElement: 'hours-box',
    minutesElement: 'minutes-box',
    secondsElement: 'seconds-box',
    targetDate: countdown.targetDate,
    onComplete: handleCountdownComplete,
    onTick: updatePageTitle
  });

  countdownController.start();

  // Force a redraw on mobile devices to ensure numbers are visible
  if (window.innerWidth <= 768) {
    setTimeout(forceRedraw, 100);
  }

  // Generate share link
  shareLinkInput.value = ShareManager.generateShareableUrl(countdown);
}

// Creates all the HTML elements needed for the flip animation
function setupCountdownElements() {
  const timeBoxes = document.querySelectorAll('.time-box');

  timeBoxes.forEach(box => {
    // Create card container
    const card = document.createElement('div');
    card.className = 'card';

    // Create the static bottom (shows bottom half of the number)
    const cardBottom = document.createElement('div');
    cardBottom.className = 'card-bottom';
    cardBottom.innerHTML = '<span class="number">00</span>';

    // Create the static top back (shows top half of the new number)
    const cardTopBack = document.createElement('div');
    cardTopBack.className = 'card-top-back';
    cardTopBack.innerHTML = '<span class="number">00</span>';

    // Create the flipping top (shows top half of the current number)
    const cardTop = document.createElement('div');
    cardTop.className = 'card-top';
    cardTop.innerHTML = '<span class="number">00</span>';

    // Assemble the structure in the correct order for proper layering
    // Bottom card first (lowest z-index)
    card.appendChild(cardBottom);
    // Then top back (middle z-index)
    card.appendChild(cardTopBack);
    // Then top card (highest z-index)
    card.appendChild(cardTop);

    // Clear and append to box
    box.innerHTML = '';
    box.appendChild(card);
  });
}

// Changes the page theme
function applyTheme(theme) {
  // Remove any existing theme classes
  document.body.classList.remove('theme-beach', 'theme-space', 'theme-forest', 'theme-city');

  // Add new theme class if not default
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }
}

// What happens when the countdown reaches zero
function handleCountdownComplete() {
  eventTitle.textContent = `${currentCountdown.name} has arrived!`;
  eventTitle.classList.add('completed');

  // Play sound if enabled
  const audio = document.getElementById('completion-sound');
  if (audio) {
    audio.play().catch(err => console.log('Audio playback prevented: ', err));
  }
}

// Updates the browser tab title with the time left
function updatePageTitle(timeValues) {
  const { days, hours, minutes, seconds } = timeValues;

  // Format time for title
  let titleTime = '';
  if (days > 0) {
    titleTime = `${days}d ${hours}h`;
  } else if (hours > 0) {
    titleTime = `${hours}h ${minutes}m`;
  } else {
    titleTime = `${minutes}m ${seconds}s`;
  }

  document.title = `${titleTime} - ${currentCountdown.name}`;
}

// Sets up all the button clicks and interactions
function setupEventListeners() {
  // Reset button
  resetButton.addEventListener('click', function() {
    window.location.href = 'index.html';
  });

  // Share button
  shareButton.addEventListener('click', function() {
    openShareModal();
  });

  // Close modal button
  closeModalButton.addEventListener('click', function() {
    closeShareModal();
  });

  // Copy link button
  copyLinkButton.addEventListener('click', function() {
    const success = ShareManager.copyToClipboard(shareLinkInput.value);
    if (success) {
      // Show success toast
      ToastManager.showToast({
        message: 'Link copied to clipboard!',
        type: 'success',
        duration: 2000
      });

      // Update button text
      copyLinkButton.textContent = 'Copied!';
      setTimeout(() => {
        copyLinkButton.textContent = 'Copy';
      }, 2000);
    }
  });

  // Close modal when clicking outside
  shareModal.addEventListener('click', function(e) {
    if (e.target === shareModal) {
      closeShareModal();
    }
  });

  // Close modal on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && shareModal.classList.contains('active')) {
      closeShareModal();
    }
  });

  // Add touch event handling for mobile devices
  setupTouchEvents();
}

// Makes things work better on touchscreens
function setupTouchEvents() {
  // Prevent double-tap zoom on buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('touchend', function(e) {
      e.preventDefault();
      // Trigger click event
      button.click();
    });
  });

  // Add touch feedback effect
  document.querySelectorAll('.time-box').forEach(box => {
    box.addEventListener('touchstart', function() {
      this.style.transform = 'scale(0.98)';
      this.style.opacity = '0.9';
    });

    box.addEventListener('touchend', function() {
      this.style.transform = 'scale(1)';
      this.style.opacity = '1';
    });

    box.addEventListener('touchcancel', function() {
      this.style.transform = 'scale(1)';
      this.style.opacity = '1';
    });
  });

  // Handle orientation changes more smoothly
  window.addEventListener('orientationchange', function() {
    // Add a class to the body during orientation change
    document.body.classList.add('orientation-changing');

    // Remove the class after the orientation change is complete
    setTimeout(function() {
      document.body.classList.remove('orientation-changing');
    }, 400);
  });
}

// Opens the sharing popup
function openShareModal() {
  shareModal.classList.add('active');
  shareLinkInput.select();
}

// Closes the sharing popup
function closeShareModal() {
  shareModal.classList.remove('active');
}

// This fixes the issue where numbers sometimes don't show up on mobile
// It forces a redraw of the elements
function forceRedraw() {
  const timeBoxes = document.querySelectorAll('.time-box');
  timeBoxes.forEach(box => {
    // Get all number elements
    const numbers = box.querySelectorAll('.number');
    numbers.forEach(number => {
      // Apply a flash effect to ensure visibility
      number.animate(
        [
          { opacity: 0.5, textShadow: '0 0 15px rgba(255, 87, 123, 1)' },
          { opacity: 1, textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)' }
        ],
        {
          duration: 300,
          easing: 'ease-out'
        }
      );
    });
  });
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
  if (countdownController && countdownController.isRunning()) {
    countdownController.stop();
  }
});

// Force redraw when page becomes visible again (helps with mobile browsers)
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && countdownController && countdownController.isRunning()) {
    forceRedraw();
  }
});
