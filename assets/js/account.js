/* global $ */

const AccountPage = (() => {
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  const updateCartCount = () => {
    const cart = storage.get('cart', []);
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    $('.cart-count').text(count);
  };

  const requireLogin = () => {
    const session = storage.get('session', null);
    if (!session || !session.user) {
      window.location.href = 'login.html';
      return null;
    }
    return session.user;
  };

  const renderStats = () => {
    $('#stat-orders').text(storage.get('orders', []).length);
    $('#stat-wishlist').text(storage.get('wishlist', []).length);
    $('#stat-returns').text(storage.get('returns', []).length);
  };

  const renderProfile = (user) => {
    $('#account-name').text(user.name || 'User');
    $('#profileName').val(user.name || '');
    $('#profileIdentifier').val(user.identifier || '');
    $('#profileCity').val(user.city || '');
    $('#profileProvince').val(user.province || '');
    $('#profileAddress').val(user.address || '');
  };

  const updateUserProfile = (data) => {
    const session = storage.get('session', null);
    if (!session || !session.user) return;

    const users = storage.get('users', []);
    const updatedUsers = users.map((user) => {
      if (user.identifier === session.user.identifier) {
        return { ...user, ...data };
      }
      return user;
    });
    storage.set('users', updatedUsers);
    session.user = { ...session.user, ...data };
    storage.set('session', session);
  };

  const bindEvents = () => {
    $('#profileForm').on('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      updateUserProfile(data);
      $('#profileMessage').text('Profile updated successfully.').removeClass('text-danger').addClass('text-success');
    });

    $('#logoutBtn').on('click', (event) => {
      event.preventDefault();
      Auth.logout();
      window.location.href = 'login.html';
    });

    $(document).on('cart:updated', updateCartCount);
    $(document).on('header:loaded', updateCartCount);
  };

  const init = () => {
    if ($('body').data('page') !== 'account') return;

    const user = requireLogin();
    if (!user) return;
    renderStats();
    renderProfile(user);
    updateCartCount();
    bindEvents();
  };

  return { init };
})();

$(AccountPage.init);
