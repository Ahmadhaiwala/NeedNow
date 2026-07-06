'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './auth';

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  user: number;
  user_name: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  platform: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderSummary {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
  recent_orders: Order[];
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getJWTToken } = useAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getJWTToken();
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${baseUrl}/api/orders${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/');
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    cart_id?: number;
    items?: Array<{ product_id: number; quantity: number }>;
    platform?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const order = await apiCall('/', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      await fetchOrders(); // Refresh orders list
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (orderId: number, paymentMethod: string, simulateFailure = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall('/pay/', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          payment_method: paymentMethod,
          simulate_failure: simulateFailure,
        }),
      });
      await fetchOrders(); // Refresh orders list
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/${orderId}/cancel/`, {
        method: 'POST',
      });
      await fetchOrders(); // Refresh orders list
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reorder = async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await apiCall(`/${orderId}/reorder/`, {
        method: 'POST',
      });
      await fetchOrders(); // Refresh orders list
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrderSummary = async (): Promise<OrderSummary> => {
    return await apiCall('/summary/');
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    simulatePayment,
    cancelOrder,
    reorder,
    getOrderSummary,
  };
}