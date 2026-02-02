/* global $ */

/* global $, bootstrap */

const UI = (() => {
  const formatNPR = (amount) => {
    if (amount === null || amount === undefined) return '';
    return `NPR ${Number(amount).toLocaleString('en-NP')}`;
  };

  const calcDiscount = (oldPrice, newPrice) => {
    if (!oldPrice || !newPrice || oldPrice <= newPrice) return 0;
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  };

  const starsHTML = (rating = 0) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let html = '';
    for (let i = 0; i < 5; i += 1) {
      if (i < full) {
        html += '<i class="fa-solid fa-star text-warning"></i>';
      } else if (i === full && half) {
        html += '<i class="fa-solid fa-star-half-stroke text-warning"></i>';
      } else {
        html += '<i class="fa-regular fa-star text-warning"></i>';
      }
    }
    return html;
  };

  const renderTemplate = (templateString, data) => {
    if (!templateString) return '';

    const renderBlock = (tpl, scope) => tpl.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      const value = scope[key];
      return value === undefined || value === null ? '' : value;
    });

    const renderRawBlock = (tpl, scope) => tpl.replace(/{{{\s*([^}\s]+)\s*}}}/g, (_, key) => {
      const value = scope[key];
      return value === undefined || value === null ? '' : value;
    });

    const loopRegex = /{{#each\s+([\w.]+)}}([\s\S]*?){{\/each}}/g;

    const renderWithLoops = (tpl, scope) => tpl.replace(loopRegex, (_, listKey, inner) => {
      const list = listKey.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), scope);
      if (!Array.isArray(list)) return '';
      return list
        .map((item, index) => {
          const loopScope = { ...scope, ...item, _index: index };
          const withRaw = renderRawBlock(inner, loopScope);
          return renderBlock(withRaw, loopScope);
        })
        .join('');
    });

    const withLoops = renderWithLoops(templateString, data);
    const withRaw = renderRawBlock(withLoops, data);
    return renderBlock(withRaw, data);
  };

  const skeletonGrid = (count = 8) => {
    let html = '<div class="row g-3">';
    for (let i = 0; i < count; i += 1) {
      html += `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card">
            <div class="ratio ratio-1x1 bg-light placeholder-glow"></div>
            <div class="card-body">
              <div class="placeholder col-10"></div>
              <div class="placeholder col-6"></div>
            </div>
          </div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  };

  const skeletonList = (count = 4) => {
    let html = '';
    for (let i = 0; i < count; i += 1) {
      html += `
        <div class="card mb-3">
          <div class="card-body">
            <div class="placeholder-glow">
              <span class="placeholder col-7"></span>
              <span class="placeholder col-4"></span>
              <span class="placeholder col-6"></span>
            </div>
          </div>
        </div>
      `;
    }
    return html;
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

  const validateRequired = (formEl) => {
    const $form = $(formEl);
    let valid = true;
    $form.find('[required]').each(function () {
      const value = $(this).val();
      const isEmpty = value === null || value === undefined || value.toString().trim() === '';
      if (isEmpty) {
        $(this).addClass('is-invalid').attr('aria-invalid', 'true');
        valid = false;
      } else {
        $(this).removeClass('is-invalid').removeAttr('aria-invalid');
      }
    });
    return valid;
  };

  const clearValidation = (formEl) => {
    $(formEl).find('.is-invalid').removeClass('is-invalid').removeAttr('aria-invalid');
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
    calcDiscount,
    starsHTML,
    renderTemplate,
    skeletonGrid,
    skeletonList,
    confirm,
    validateRequired,
    clearValidation,
    showToast,
  };
})();
