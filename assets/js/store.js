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
    add(productId, variant = { color: '', size: '' }, qty = 1) {
      const items = storage.get('cart', []);
      const key = `${productId}|${variant.color || ''}|${variant.size || ''}`;
      const existing = items.find((item) => item.key === key);
      if (existing) {
        existing.qty += qty;
      } else {
        items.push({ key, productId, variant, qty });
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
    toggle(productId) {
      const items = storage.get('wishlist', []);
      const index = items.indexOf(productId);
      if (index >= 0) {
        items.splice(index, 1);
      } else {
        items.unshift(productId);
      }
      storage.set('wishlist', items);
      $(document).trigger('wishlist:updated', [items]);
      return items;
    },
    get() {
      return storage.get('wishlist', []);
    },
  };

  const seedDemo = () => {
    const demoUser = {
      name: 'Demo User',
      identifier: 'demo@daraz.test',
      password: 'Demo1234',
      city: 'Kathmandu',
      province: 'Bagmati',
      address: 'New Road',
    };

    storage.set('users', [demoUser]);
    storage.set('session', { token: `sess_${Date.now()}`, user: demoUser });
    storage.set('wishlist', ['P1007', 'P1019', 'P1025']);
    storage.set('cart', [
      { key: 'P1001|Maroon|M', productId: 'P1001', qty: 1, variant: { color: 'Maroon', size: 'M' } },
      { key: 'P1027|Black|', productId: 'P1027', qty: 1, variant: { color: 'Black', size: '' } },
    ]);
    storage.set('addresses', [
      {
        id: 'ADDR-DEM-1',
        name: 'Demo User',
        phone: '9800000000',
        province: 'Bagmati',
        city: 'Kathmandu',
        area: 'Thamel',
        landmark: 'Near Durbar Marg',
      },
    ]);
    storage.set('selectedAddress', 'ADDR-DEM-1');
    storage.set('orders', [
      {
        orderId: 'ORD-2026-0101',
        date: '2026-01-25',
        status: 'delivered',
        payment: 'COD',
        total: 2498,
        items: [
          { productId: 'P1001', qty: 1, price: 1899 },
          { productId: 'P1029', qty: 1, price: 299 },
          { productId: 'P1032', qty: 1, price: 599 },
        ],
        shippingAddress: {
          name: 'Demo User',
          phone: '9800000000',
          province: 'Bagmati',
          city: 'Kathmandu',
          area: 'Thamel',
          landmark: 'Near Durbar Marg',
        },
      },
      {
        orderId: 'ORD-2026-0123',
        date: '2026-01-30',
        status: 'shipped',
        payment: 'Card',
        total: 18999,
        items: [{ productId: 'P1019', qty: 1, price: 18999 }],
        shippingAddress: {
          name: 'Demo User',
          phone: '9800000000',
          province: 'Bagmati',
          city: 'Kathmandu',
          area: 'Thamel',
          landmark: 'Near Durbar Marg',
        },
      },
    ]);
    storage.set('returns', []);
  };

  return { storage, Cart, Wishlist, seedDemo };
})();
