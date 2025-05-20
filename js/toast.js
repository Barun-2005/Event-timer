// Makes those nice popup notifications instead of using ugly browser alerts

const ToastManager = (function() {
  // Where we'll put all the toast notifications
  let toastContainer = null;

  // Counter so each toast gets a unique ID
  let toastCounter = 0;

  // Creates the container for toasts if it doesn't exist yet
  function createToastContainer() {
    if (toastContainer) return;

    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Shows a toast notification with the given message and type
  function showToast(options) {
    createToastContainer();

    const { message, type = 'info', duration = 3000 } = options;
    const toastId = `toast-${++toastCounter}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;

    // Add icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '✅';
        break;
      case 'error':
        icon = '❌';
        break;
      case 'warning':
        icon = '⚠️';
        break;
      default:
        icon = 'ℹ️';
    }

    // Create toast content
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">${message}</div>
      <button class="toast-close">×</button>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Add animation class after a small delay (for animation to work)
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Add close button event
    toast.querySelector('.toast-close').addEventListener('click', () => {
      closeToast(toastId);
    });

    // Auto close after duration
    if (duration > 0) {
      setTimeout(() => {
        closeToast(toastId);
      }, duration);
    }

    return toastId;
  }

  // Closes a specific toast by its ID
  function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    // Add closing animation
    toast.classList.remove('show');
    toast.classList.add('hide');

    // Remove after animation completes
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Shows a confirmation dialog with Yes/No buttons
  function showConfirmToast(options) {
    createToastContainer();

    const {
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm,
      onCancel
    } = options;

    const toastId = `toast-${++toastCounter}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast toast-confirm';
    toast.id = toastId;

    // Create toast content
    toast.innerHTML = `
      <div class="toast-icon">❓</div>
      <div class="toast-content">${message}</div>
      <div class="toast-actions">
        <button class="toast-btn toast-cancel">${cancelText}</button>
        <button class="toast-btn toast-confirm-btn">${confirmText}</button>
      </div>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Add animation class after a small delay
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Add button events
    toast.querySelector('.toast-confirm-btn').addEventListener('click', () => {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      closeToast(toastId);
    });

    toast.querySelector('.toast-cancel').addEventListener('click', () => {
      if (typeof onCancel === 'function') {
        onCancel();
      }
      closeToast(toastId);
    });

    return toastId;
  }

  // The functions other code can use
  return {
    showToast,
    closeToast,
    showConfirmToast
  };
})();
