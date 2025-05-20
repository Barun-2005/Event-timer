// Main countdown functionality - handles all the timer stuff and animations
// I wrapped everything in a module to keep it clean and avoid global variables

const CountdownManager = (function() {
  // This function creates a new countdown timer
  // You pass in options like which elements to update and the target date
  // Returns an object with methods to control the countdown
  function createCountdown(options) {
    const elements = {
      days: document.getElementById(options.daysElement),
      hours: document.getElementById(options.hoursElement),
      minutes: document.getElementById(options.minutesElement),
      seconds: document.getElementById(options.secondsElement)
    };

    let interval = null;
    let previousValues = {
      days: null,
      hours: null,
      minutes: null,
      seconds: null
    };

    // Updates the display with the current time left
    function updateDisplay() {
      const now = new Date().getTime();
      const targetTime = new Date(options.targetDate).getTime();
      const timeLeft = targetTime - now;

      // If countdown is over
      if (timeLeft < 0) {
        stop();

        // Set all values to zero
        updateElement('days', 0);
        updateElement('hours', 0);
        updateElement('minutes', 0);
        updateElement('seconds', 0);

        if (typeof options.onComplete === 'function') {
          options.onComplete();
        }

        return;
      }

      // Calculate time units
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      // Update display for each unit
      updateElement('days', days);
      updateElement('hours', hours);
      updateElement('minutes', minutes);
      updateElement('seconds', seconds);

      // Call onTick callback if provided
      if (typeof options.onTick === 'function') {
        options.onTick({
          days,
          hours,
          minutes,
          seconds,
          timeLeft
        });
      }
    }

    // This handles the flip animation when a number changes
    // Got a bit complex but it looks cool when it works
    function updateElement(unit, value) {
      // Format value to always have two digits
      const formattedValue = value < 10 ? `0${value}` : `${value}`;

      // Skip if value hasn't changed
      if (previousValues[unit] === formattedValue) {
        return;
      }

      // Get the element
      const element = elements[unit];
      if (!element) return;

      // Get the card and its components
      const card = element.querySelector('.card');
      if (!card) return;

      // Get all number elements
      const topNumber = element.querySelector('.card-top .number');
      const topBackNumber = element.querySelector('.card-top-back .number');
      const bottomNumber = element.querySelector('.card-bottom .number');

      // If this is the first update, just set all values without animation
      if (previousValues[unit] === null) {
        if (topNumber) topNumber.textContent = formattedValue;
        if (topBackNumber) topBackNumber.textContent = formattedValue;
        if (bottomNumber) bottomNumber.textContent = formattedValue;
        previousValues[unit] = formattedValue;
        return;
      }

      // IMPORTANT: Keep the old value in the top card that will flip
      if (topNumber) topNumber.textContent = previousValues[unit];

      // Set the new value in the top back card (will be visible after flip)
      if (topBackNumber) topBackNumber.textContent = formattedValue;

      // IMPORTANT: Keep the old value in the bottom card initially
      // We'll update it after the flip animation is halfway complete
      if (bottomNumber) bottomNumber.textContent = previousValues[unit];

      // Remove any existing flip animation
      card.classList.remove('flip');

      // Force browser reflow
      void card.offsetWidth;

      // Add a small pre-animation effect
      card.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-2px)' },
          { transform: 'translateY(0)' }
        ],
        {
          duration: 100,
          easing: 'ease-out'
        }
      );

      // Add flip class to trigger the animation
      card.classList.add('flip');

      // Get animation duration based on screen size
      const isMobile = window.innerWidth <= 768;
      const isSmallMobile = window.innerWidth <= 480;
      const animationDuration = isSmallMobile ? 400 : (isMobile ? 500 : 600);
      const halfDuration = animationDuration / 2;

      // Improve visibility during animation with a stronger glow effect for mobile
      const glowEffect = isSmallMobile ?
        '0 0 10px rgba(255, 87, 123, 1), 0 0 15px rgba(255, 87, 123, 0.8)' :
        '0 0 8px rgba(255, 87, 123, 0.8)';

      if (topNumber) {
        topNumber.style.textShadow = glowEffect;
        // Increase contrast for better visibility on mobile only
        if (isMobile) {
          topNumber.style.color = '#ff5a79';
        }
      }
      if (topBackNumber) {
        topBackNumber.style.textShadow = glowEffect;
        if (isMobile) {
          topBackNumber.style.color = '#ff5a79';
        }
      }

      // IMPORTANT: Update bottom card halfway through the animation
      // This creates the effect of the top card flipping down, then the bottom card changing
      setTimeout(() => {
        if (bottomNumber) {
          bottomNumber.textContent = formattedValue;
          bottomNumber.style.textShadow = glowEffect;
          // Increase contrast for better visibility on mobile only
          if (isMobile) {
            bottomNumber.style.color = '#ff5a79';
          }
        }
      }, halfDuration); // Half of the animation duration

      // After the flip animation completes, update the top card for the next flip
      setTimeout(() => {
        if (topNumber) {
          topNumber.textContent = formattedValue;
          topNumber.style.textShadow = '';
          topNumber.style.color = '';
        }
        if (topBackNumber) {
          topBackNumber.style.textShadow = '';
          topBackNumber.style.color = '';
        }
        if (bottomNumber) {
          bottomNumber.style.textShadow = '';
          bottomNumber.style.color = '';
        }
        card.classList.remove('flip');
      }, animationDuration); // Match this with the CSS animation duration

      // Store current value for next comparison
      previousValues[unit] = formattedValue;
    }

    // Starts the countdown running
    function start() {
      if (interval) return;

      // Initial update
      updateDisplay();

      // Set interval for updates
      interval = setInterval(updateDisplay, 1000);

      // Add resize listener to handle orientation changes
      window.addEventListener('resize', handleResize);

      // Add orientation change listener for mobile devices
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Fixes display issues when phone orientation changes
    function handleOrientationChange() {
      // Small delay to allow the browser to complete the orientation change
      setTimeout(() => {
        // Force a redraw of the countdown elements
        const elements = document.querySelectorAll('.time-box');
        elements.forEach(element => {
          // Apply a small animation to refresh the rendering
          element.animate(
            [
              { opacity: 0.9 },
              { opacity: 1 }
            ],
            {
              duration: 300,
              easing: 'ease-out'
            }
          );
        });

        // Update the display
        updateDisplay();
      }, 300);
    }

    // Handles window resize - mostly for mobile orientation changes
    function handleResize() {
      // Force a refresh of the display after resize
      if (interval) {
        updateDisplay();
      }
    }

    // Stops the countdown and cleans up
    function stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;

        // Remove event listeners when countdown stops
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    }

    // Just checks if the countdown is currently running
    function isRunning() {
      return interval !== null;
    }

    // Gets how much time is left in milliseconds
    function getTimeRemaining() {
      const now = new Date().getTime();
      const targetTime = new Date(options.targetDate).getTime();
      return Math.max(0, targetTime - now);
    }

    // These are the functions other code can use
    return {
      start,
      stop,
      isRunning,
      getTimeRemaining
    };
  }

  return {
    createCountdown
  };
})();
