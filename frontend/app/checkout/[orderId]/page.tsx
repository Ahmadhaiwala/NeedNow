"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useOrders, Order } from "@/lib/orders";
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const colors = {
  navy: "#2F4156",
  teal: "#567C8D", 
  skyBlue: "#C8D9E6",
  beige: "#F5EFEB",
  white: "#FFFFFF"
};

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { id: 'upi', name: 'UPI', icon: Smartphone, description: 'PhonePe, GPay, Paytm' },
  { id: 'netbanking', name: 'Net Banking', icon: Building2, description: 'All major banks' },
  { id: 'wallet', name: 'Digital Wallet', icon: Wallet, description: 'Paytm, PhonePe Wallet' },
  { id: 'cod', name: 'Cash on Delivery', icon: Truck, description: 'Pay when you receive' },
];

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { orders, simulatePayment } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    if (orders.length > 0) {
      const foundOrder = orders.find(o => o.id === parseInt(orderId));
      setOrder(foundOrder || null);
    }
  }, [orders, orderId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to complete your payment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600">The order you're trying to pay for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  if (order.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Already Paid</h1>
            <p className="text-gray-600">This order has already been paid for.</p>
            <button
              onClick={() => router.push('/orders')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const result = await simulatePayment(order.id, selectedPaymentMethod, simulateFailure);
      setPaymentResult(result);

      if (result.success) {
        setTimeout(() => {
          router.push('/orders?payment=success');
        }, 3000);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: error instanceof Error ? error.message : 'Payment failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{order.id}</span>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Items:</h3>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">₹{item.total_price}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            
            {!paymentResult ? (
              <>
                <div className="space-y-3 mb-6">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <motion.label
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <Icon className="w-6 h-6 text-gray-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </motion.label>
                    );
                  })}
                </div>

                {/* Simulate Failure Option */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-yellow-800">
                      Simulate payment failure (for testing)
                    </span>
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ₹${order.total_amount}`
                  )}
                </motion.button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center p-6 rounded-lg ${
                  paymentResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {paymentResult.success ? (
                  <>
                    <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
                    <p className="text-green-700 mb-4">{paymentResult.message}</p>
                    {paymentResult.transaction_id && (
                      <p className="text-sm text-green-600 mb-4">
                        Transaction ID: {paymentResult.transaction_id}
                      </p>
                    )}
                    <p className="text-sm text-green-600">
                      Redirecting to orders page in 3 seconds...
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-bold text-red-900 mb-2">Payment Failed</h3>
                    <p className="text-red-700 mb-4">{paymentResult.message}</p>
                    <button
                      onClick={() => setPaymentResult(null)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}