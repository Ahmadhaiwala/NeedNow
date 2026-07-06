"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useOrders, Order, OrderSummary } from "@/lib/orders";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Truck,
  RotateCcw,
  AlertCircle,
  DollarSign,
} from "lucide-react";

const colors = {
  navy: "#2F4156",
  teal: "#567C8D", 
  skyBlue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF"
};

const statusIcons = {
  pending: Clock,
  placed: Package,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RotateCcw,
};

const statusColors = {
  pending: "#f59e0b",
  placed: "#3b82f6",
  confirmed: "#10b981",
  processing: "#6366f1",
  shipped: "#8b5cf6",
  delivered: "#059669",
  cancelled: "#ef4444",
  refunded: "#6b7280",
};

const paymentStatusColors = {
  pending: "#f59e0b",
  paid: "#10b981",
  failed: "#ef4444",
  refunded: "#6b7280",
  partially_paid: "#3b82f6",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, error, fetchOrders, cancelOrder, reorder, getOrderSummary } = useOrders();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrderSummaryData();
    }
  }, [user]);

  const fetchOrderSummaryData = async () => {
    try {
      const summaryData = await getOrderSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      await cancelOrder(orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const newOrder = await reorder(orderId);
      alert(`New order created! Order ID: ${newOrder.id}`);
    } catch (error) {
      console.error('Failed to reorder:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to view your orders.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !orders.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Order Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.pending_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.completed_orders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{summary.total_spent}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">Start shopping to see your orders here!</p>
              <a
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Products
              </a>
            </div>
          ) : (
            orders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <StatusIcon 
                          size={24} 
                          style={{ color: statusColors[order.status as keyof typeof statusColors] }}
                        />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{order.total_amount}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: statusColors[order.status as keyof typeof statusColors] + '20',
                              color: statusColors[order.status as keyof typeof statusColors],
                            }}
                          >
                            {order.status}
                          </span>
                          <span
                            className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors] + '20',
                              color: paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors],
                            }}
                          >
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-6 py-4">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × ₹{item.unit_price}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ₹{item.total_price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                      {order.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                        >
                          {actionLoading === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReorder(order.id)}
                        disabled={actionLoading === order.id}
                        className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50"
                      >
                        {actionLoading === order.id ? 'Reordering...' : 'Reorder'}
                      </motion.button>
                      
                      {order.payment_status === 'pending' && (
                        <a
                          href={`/checkout/${order.id}`}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                          Pay Now
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-red-50 border border-red-200 rounded-md p-4"
          >
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}