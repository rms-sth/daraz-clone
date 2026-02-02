/* global $, bootstrap */

const UI = (() => {
  const formatNPR = (amount) => {
    if (amount === null || amount === undefined) return '';
    return `NPR ${Number(amount).toLocaleString('en-NP')}`;
  };

  const ensureConfirmModal = () => {
    if ($('#confirmModal').length) return;
    const modal = `
      <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmTitle">Confirm</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="confirmMessage"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="confirmCancel">Cancel</button>
              <button type="button" class="btn btn-dark" id="confirmOk">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(modal);
  };

  const confirm = (message, onConfirm, options = {}) => {
    ensureConfirmModal();
    $('#confirmTitle').text(options.title || 'Confirm');
    $('#confirmMessage').text(message || 'Are you sure?');
    $('#confirmOk').text(options.confirmText || 'Confirm');
    $('#confirmCancel').text(options.cancelText || 'Cancel');
    const modalEl = document.getElementById('confirmModal');
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);

    $('#confirmOk').off('click').on('click', () => {
      if (typeof onConfirm === 'function') onConfirm();
      instance.hide();
    });

    instance.show();
  };

  const showToast = (message, type = 'primary') => {
    const toastId = `toast-${Date.now()}`;
    const toast = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    let container = $('#toast-container');
    if (!container.length) {
      $('body').append('<div id="toast-container" class="toast-container position-fixed top-0 end-0 p-3"></div>');
      container = $('#toast-container');
    }
    container.append(toast);
    const instance = bootstrap.Toast.getOrCreateInstance(document.getElementById(toastId));
    instance.show();
  };

  return {
    formatNPR,
    confirm,
    showToast,
  };
})();
