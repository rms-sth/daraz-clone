/* global $ */

const Store = (() => {
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

  const Cart = {
    add(productId, variant = { color: '', size: '' }, qty = 1, productData = null) {
      const items = storage.get('cart', []);
      const key = `${productId}|${variant.color || ''}|${variant.size || ''}`;
      const existing = items.find((item) => item.key === key);
      if (existing) {
        existing.qty += qty;
        if (productData) existing.product = productData;
      } else {
        items.push({ key, productId, variant, qty, product: productData });
      }
      storage.set('cart', items);
      $(document).trigger('cart:updated', [items]);
      return items;
    },
    remove(key) {
      const items = storage.get('cart', []).filter((item) => item.key !== key);
      storage.set('cart', items);
      $(document).trigger('cart:updated', [items]);
      return items;
    },
    updateQty(key, qty) {
      const items = storage.get('cart', []).map((item) => {
        if (item.key === key) {
          return { ...item, qty: Math.max(1, qty) };
        }
        return item;
      });
      storage.set('cart', items);
      $(document).trigger('cart:updated', [items]);
      return items;
    },
    get() {
      return storage.get('cart', []);
    },
    total() {
      const items = storage.get('cart', []);
      return items.reduce((sum, item) => sum + (item.qty || 0), 0);
    },
  };

  const Wishlist = {
    toggle(productId, productData = null) {
      const items = storage.get('wishlist', []);
      const ids = items.map((item) => (typeof item === 'string' ? item : item.id));
      const index = ids.indexOf(productId);
      if (index >= 0) {
        items.splice(index, 1);
      } else {
        items.unshift(productData || { id: productId });
      }
      storage.set('wishlist', items);
      $(document).trigger('wishlist:updated', [items]);
      return items;
    },
    get() {
      return storage.get('wishlist', []);
    },
  };

  return { storage, Cart, Wishlist };
})();
