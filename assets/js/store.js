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
    storage.set('wishlist', [
      { id: 'P1007', title: 'Vitamin C Serum 30ml', price: 1299, image: '../assets/img/placeholder.svg' },
      { id: 'P1019', title: 'Android Smartphone 6.5 inch', price: 18999, image: '../assets/img/placeholder.svg' },
      { id: 'P1025', title: 'Air Fryer 4L', price: 11999, image: '../assets/img/placeholder.svg' },
    ]);
    storage.set('cart', [
      { key: 'P1001|Maroon|M', productId: 'P1001', qty: 1, variant: { color: 'Maroon', size: 'M' }, product: { id: 'P1001', title: "Women's Floral Kurta Set", price: 1899, image: '../assets/img/placeholder.svg' } },
      { key: 'P1027|Black|', productId: 'P1027', qty: 1, variant: { color: 'Black', size: '' }, product: { id: 'P1027', title: 'True Wireless Earbuds', price: 2399, image: '../assets/img/placeholder.svg' } },
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
