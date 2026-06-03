import type { Order } from '../types';

export const dbMock = {
  getOrders(): Order[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('mock_orders');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading mock_orders:', e);
      return [];
    }
  },

  saveOrder(order: Order): Order {
    if (typeof window === 'undefined') return order;
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === order.id);
    if (idx > -1) {
      orders[idx] = order;
    } else {
      orders.push(order);
    }
    localStorage.setItem('mock_orders', JSON.stringify(orders));
    return order;
  },

  deleteOrder(id: string): void {
    if (typeof window === 'undefined') return;
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem('mock_orders', JSON.stringify(filtered));
  }
};
