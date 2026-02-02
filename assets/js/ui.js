/* global $, bootstrap */

const UI = (() => {
  const formatNPR = (amount) => {
    if (amount === null || amount === undefined) return '';
    return `NPR ${Number(amount).toLocaleString('en-NP')}`;
  };

  const confirm = (message, onConfirm, options = {}) => {
    const modalEl = document.getElementById('confirmModal');
    if (!modalEl) {
      if (window.confirm(message || 'Are you sure?')) {
        if (typeof onConfirm === 'function') onConfirm();
      }
      return;
    }

    $('#confirmTitle').text(options.title || 'Confirm');
    $('#confirmMessage').text(message || 'Are you sure?');
    $('#confirmOk').text(options.confirmText || 'Confirm');
    $('#confirmCancel').text(options.cancelText || 'Cancel');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);

    $('#confirmOk').off('click').on('click', () => {
      if (typeof onConfirm === 'function') onConfirm();
      instance.hide();
    });

    instance.show();
  };

  const showToast = (message, type = 'primary') => {
    const toastEl = document.getElementById('appToast');
    if (!toastEl) return;
    $('#appToastBody').text(message);
    $(toastEl)
      .removeClass('text-bg-primary text-bg-success text-bg-danger text-bg-secondary text-bg-warning text-bg-info')
      .addClass(`text-bg-${type}`);
    const instance = bootstrap.Toast.getOrCreateInstance(toastEl);
    instance.show();
  };

  return {
    formatNPR,
    confirm,
    showToast,
  };
})();
