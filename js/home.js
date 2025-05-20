// This handles the home page - the form for creating countdowns
// and showing the history of saved countdowns

// DOM Elements
const countdownForm = document.getElementById('countdown-form');
const eventNameInput = document.getElementById('event-name');
const eventDateInput = document.getElementById('event-date');
const backgroundOptions = document.querySelectorAll('.bg-option');
const countdownList = document.getElementById('countdown-list');

// Background selection
let selectedBackground = 'default';

// When the page loads
document.addEventListener('DOMContentLoaded', function() {
  setupDateInput();
  setupBackgroundSelection();
  loadCountdownHistory();

  // Apply the selected theme on page load
  const selectedOption = document.querySelector('.bg-option.selected');
  if (selectedOption) {
    applyThemeToPage(selectedOption.dataset.background);
  }
});

// Sets up the date input with tomorrow's date as default
function setupDateInput() {
  // Set min date to today
  const now = new Date();
  const today = now.toISOString().slice(0, 16);
  eventDateInput.min = today;

  // Set default date to tomorrow at noon
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  eventDateInput.value = tomorrow.toISOString().slice(0, 16);
}

// Handles clicking on background options
function setupBackgroundSelection() {
  backgroundOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove selected class from all options
      backgroundOptions.forEach(opt => opt.classList.remove('selected'));

      // Add selected class to clicked option
      this.classList.add('selected');

      // Store selected background
      selectedBackground = this.dataset.background;

      // Apply theme immediately to current page
      applyThemeToPage(selectedBackground);
    });
  });

  // Set default selection
  const defaultOption = document.querySelector('.bg-option[data-background="default"]');
  if (defaultOption) {
    defaultOption.classList.add('selected');
  }
}

// Changes the page theme when you select a background
function applyThemeToPage(theme) {
  // Remove any existing theme classes
  document.body.classList.remove('theme-beach', 'theme-space', 'theme-forest', 'theme-city');

  // Add new theme class if not default
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }
}

// Shows all your saved countdowns
function loadCountdownHistory() {
  const countdowns = StorageManager.getCountdowns();

  // Clear existing list
  countdownList.innerHTML = '';

  if (countdowns.length === 0) {
    // Hide history section if no countdowns
    document.getElementById('history-section').classList.add('hidden');
    return;
  }

  // Show history section
  document.getElementById('history-section').classList.remove('hidden');

  // Sort countdowns by creation date (newest first)
  countdowns.sort((a, b) => new Date(b.created) - new Date(a.created));

  // Create countdown cards
  countdowns.forEach(countdown => {
    const card = createCountdownCard(countdown);
    countdownList.appendChild(card);
  });
}

// Makes a card for each countdown in the history
function createCountdownCard(countdown) {
  const card = document.createElement('div');
  card.className = 'countdown-card';
  card.dataset.id = countdown.id;

  // Calculate time left
  const now = new Date().getTime();
  const targetTime = new Date(countdown.targetDate).getTime();
  const timeLeft = targetTime - now;

  // Add status class based on time left
  if (timeLeft <= 0) {
    card.classList.add('expired');
  } else if (timeLeft < 86400000) { // Less than 1 day
    card.classList.add('ending-soon');
  }

  // Format date
  const targetDate = new Date(countdown.targetDate);
  const dateFormatted = targetDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Format time
  const timeFormatted = targetDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format time left
  let timeLeftText;
  let timeLeftClass = '';

  if (timeLeft <= 0) {
    timeLeftText = 'Expired';
    timeLeftClass = 'expired';
  } else {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      timeLeftText = hours === 1 ? '1 hour left' : `${hours} hours left`;
      timeLeftClass = 'ending-soon';
    } else {
      timeLeftText = days === 1 ? '1 day left' : `${days} days left`;
    }
  }

  // Apply theme indicator if not default
  let themeIndicator = '';
  if (countdown.theme && countdown.theme !== 'default') {
    themeIndicator = `<span class="theme-indicator ${countdown.theme}-indicator" title="${countdown.theme} theme"></span>`;
  }

  // Create card content with improved layout
  card.innerHTML = `
    <div class="card-header">
      <h3 title="${countdown.name}">${countdown.name}</h3>
      ${themeIndicator}
    </div>
    <div class="card-body">
      <div class="card-date">
        <span class="date">${dateFormatted}</span>
        <span class="time">${timeFormatted}</span>
      </div>
      <p class="time-left ${timeLeftClass}">${timeLeftText}</p>
    </div>
    <div class="card-actions">
      <button class="card-btn view-btn" title="View Countdown">⏱️</button>
      <button class="card-btn share-btn" title="Share">🔗</button>
      <button class="card-btn delete-btn" title="Delete">🗑️</button>
    </div>
  `;

  // Add click event to open countdown
  card.querySelector('.view-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    window.location.href = `countdown.html?id=${countdown.id}`;
  });

  // Add delete button event
  card.querySelector('.delete-btn').addEventListener('click', function(e) {
    e.stopPropagation();

    // Show confirmation toast instead of browser confirm dialog
    ToastManager.showConfirmToast({
      message: `Are you sure you want to delete "${countdown.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: function() {
        // Delete the countdown
        StorageManager.deleteCountdown(countdown.id);

        // Show success toast
        ToastManager.showToast({
          message: `"${countdown.name}" has been deleted.`,
          type: 'success',
          duration: 3000
        });

        // Reload the countdown list
        loadCountdownHistory();
      }
    });
  });

  // Add share button event
  card.querySelector('.share-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    const url = ShareManager.generateShareableUrl(countdown);

    // Try to use Web Share API, fall back to clipboard
    if (!navigator.share) {
      ShareManager.copyToClipboard(url);
      // Show success toast instead of alert
      ToastManager.showToast({
        message: 'Countdown link copied to clipboard!',
        type: 'success',
        duration: 3000
      });
    } else {
      ShareManager.shareCountdown({
        title: `Countdown to ${countdown.name}`,
        text: `Check out this countdown to ${countdown.name}!`,
        url: url
      });
    }
  });

  return card;
}

// Copies text to clipboard
function copyToClipboard(text) {
  // Use the modern Clipboard API if available
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .catch(err => {
        console.error('Failed to copy text: ', err);
        fallbackCopyToClipboard(text);
      });
  } else {
    // Fall back to the older method
    fallbackCopyToClipboard(text);
  }
}

// Old-school way to copy text if the modern way doesn't work
function fallbackCopyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      console.error('Failed to copy text with execCommand');
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }

  document.body.removeChild(textarea);
}

// Form submission
countdownForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const eventName = eventNameInput.value.trim();
  const targetDate = eventDateInput.value;

  if (!eventName || !targetDate) {
    // Show error toast instead of alert
    ToastManager.showToast({
      message: 'Please fill in all fields',
      type: 'error',
      duration: 3000
    });
    return;
  }

  // Create countdown object
  const countdown = {
    name: eventName,
    targetDate: targetDate,
    theme: selectedBackground,
    created: new Date().toISOString()
  };

  // Save countdown
  const id = StorageManager.saveCountdown(countdown);

  // Redirect to countdown page
  window.location.href = `countdown.html?id=${id}`;
});
