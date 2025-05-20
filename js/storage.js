// This handles all the localStorage stuff - saving and loading countdowns

const StorageManager = (function() {
  const STORAGE_KEY = 'countdown_timers';

  // Makes a random ID for each countdown
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Saves a countdown to localStorage and returns its ID
  function saveCountdown(countdown) {
    // Generate ID if not provided
    if (!countdown.id) {
      countdown.id = generateId();
    }

    // Add creation timestamp if not present
    if (!countdown.created) {
      countdown.created = new Date().toISOString();
    }

    // Get existing countdowns
    const countdowns = getCountdowns();

    // Check if countdown with this ID already exists
    const existingIndex = countdowns.findIndex(c => c.id === countdown.id);

    if (existingIndex >= 0) {
      // Update existing countdown
      countdowns[existingIndex] = countdown;
    } else {
      // Add new countdown
      countdowns.push(countdown);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns));

    return countdown.id;
  }

  // Gets all the saved countdowns as an array
  function getCountdowns() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Finds a specific countdown by its ID
  function getCountdownById(id) {
    const countdowns = getCountdowns();
    return countdowns.find(countdown => countdown.id === id) || null;
  }

  // Deletes a countdown - returns true if it was found and deleted
  function deleteCountdown(id) {
    const countdowns = getCountdowns();
    const initialLength = countdowns.length;

    const filteredCountdowns = countdowns.filter(countdown => countdown.id !== id);

    if (filteredCountdowns.length !== initialLength) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCountdowns));
      return true;
    }

    return false;
  }

  // Wipes all saved countdowns
  function clearAllCountdowns() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Gets the most recently created countdown
  function getMostRecentCountdown() {
    const countdowns = getCountdowns();

    if (countdowns.length === 0) {
      return null;
    }

    // Sort by creation date (newest first)
    return countdowns.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    })[0];
  }

  // The functions we want to make available
  return {
    generateId,
    saveCountdown,
    getCountdowns,
    getCountdownById,
    deleteCountdown,
    clearAllCountdowns,
    getMostRecentCountdown
  };
})();
