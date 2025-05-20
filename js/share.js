// Handles all the sharing stuff - creating links and copying to clipboard

const ShareManager = (function() {
  // Creates a URL that people can use to view a countdown
  function generateShareableUrl(countdown, useId = true) {
    const baseUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}countdown.html`;

    if (useId && countdown.id) {
      // Use ID-based URL (shorter)
      return `${baseUrl}?id=${encodeURIComponent(countdown.id)}`;
    } else {
      // Use parameter-based URL (works without storage)
      const params = new URLSearchParams();
      params.set('name', countdown.name);
      params.set('date', countdown.targetDate);

      if (countdown.theme) {
        params.set('theme', countdown.theme);
      }

      return `${baseUrl}?${params.toString()}`;
    }
  }

  // Reads the URL to get countdown info when someone opens a shared link
  function parseCountdownFromUrl() {
    const params = new URLSearchParams(window.location.search);

    // Check for ID parameter
    const id = params.get('id');
    if (id) {
      return { id };
    }

    // Check for direct parameters
    const name = params.get('name');
    const targetDate = params.get('date');

    if (name && targetDate) {
      const countdown = {
        name,
        targetDate
      };

      // Optional parameters
      const theme = params.get('theme');
      if (theme) {
        countdown.theme = theme;
      }

      return countdown;
    }

    return null;
  }

  // Copies text to clipboard - returns true if it worked
  function copyToClipboard(text) {
    try {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  }

  // Uses the Web Share API if the browser supports it
  function shareCountdown(data) {
    if (navigator.share) {
      try {
        navigator.share(data);
        return true;
      } catch (err) {
        console.error('Error sharing: ', err);
        return false;
      }
    }
    return false;
  }

  return {
    generateShareableUrl,
    parseCountdownFromUrl,
    copyToClipboard,
    shareCountdown
  };
})();
