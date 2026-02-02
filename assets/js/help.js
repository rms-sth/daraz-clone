/* global $ */

const HelpPage = (() => {
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    },
  };

  const updateCartCount = () => {
    const cart = storage.get('cart', []);
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const filterFaq = (term) => {
    const value = term.trim().toLowerCase();
    $('#faqAccordion .accordion-item').each(function () {
      const text = $(this).text().toLowerCase();
      const keywords = ($(this).data('keywords') || '').toString().toLowerCase();
      const match = !value || text.includes(value) || keywords.includes(value);
      $(this).toggleClass('d-none', !match);
    });
  };

  const init = () => {
    if ($('body').data('page') !== 'help') return;

    $('#faqSearch').on('input', function () {
      filterFaq($(this).val());
    });

    updateCartCount();
    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  return { init };
})();

$(HelpPage.init);
