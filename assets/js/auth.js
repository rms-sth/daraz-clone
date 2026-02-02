/* global $, UI */

const Auth = (() => {
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

  const getUsers = () => storage.get('users', []);

  const saveUsers = (users) => storage.set('users', users);

  const getSession = () => storage.get('session', null);

  const setSession = (user) => {
    storage.set('session', {
      token: `sess_${Date.now()}`,
      user,
    });
  };

  const clearSession = () => storage.set('session', null);

  const findUser = (identifier) => {
    const users = getUsers();
    return users.find((user) => user.identifier === identifier);
  };

  const register = (payload) => {
    const users = getUsers();
    if (users.some((user) => user.identifier === payload.identifier)) {
      return { ok: false, message: 'Account already exists. Please login.' };
    }
    users.push(payload);
    saveUsers(users);
    setSession(payload);
    return { ok: true };
  };

  const login = (identifier, password) => {
    const user = findUser(identifier);
    if (!user) {
      return { ok: false, message: 'No account found with this identifier.' };
    }
    if (user.password !== password) {
      return { ok: false, message: 'Incorrect password.' };
    }
    setSession(user);
    return { ok: true };
  };

  const logout = () => {
    clearSession();
    $(document).trigger('session:updated');
  };

  const updateHeader = () => {
    const session = getSession();
    const header = $('.utility-bar');
    if (!header.length) return;

    if (session && session.user) {
      header.find('a[href$="login.html"]').text('My Account').attr('href', '../pages/account.html');
      header.find('a[href$="signup.html"]').text('Orders').attr('href', '../pages/orders.html');
    }
  };

  const init = () => {
    updateHeader();
    $(document).on('header:loaded', updateHeader);
    $(document).on('session:updated', updateHeader);
  };

  return {
    init,
    register,
    login,
    logout,
    getSession,
  };
})();

$(Auth.init);
