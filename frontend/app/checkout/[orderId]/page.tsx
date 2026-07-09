"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Package,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const paymentMethods = [
  { id: "card",       name: "Credit / Debit Card", icon: CreditCard,  description: "Visa, Mastercard, RuPay" },
  { id: "upi",        name: "UPI",                  icon: Smartphone,  description: "PhonePe, GPay, Paytm" },
  { id: "netbanking", name: "Net Banking",           icon: Building2,   description: "All major banks" },
  { id: "wallet",     name: "Digital Wallet",        icon: Wallet,      description: "Paytm, PhonePe Wallet" },
  { id: "cod",        name: "Cash on Delivery",      icon: Truck,       description: "Pay when you receive" },
];

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { orders, simulatePayment } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    if (orders.length > 0) {
      const found = orders.find((o) => o.id === parseInt(orderId));
      setOrder(found || null);
    }
  }, [orders, orderId]);

  const handlePayment = async () => {
    if (!order) return;
    setIsProcessing(true);
    setPaymentResult(null);
    try {
      const result = await simulatePayment(order.id, selectedPayment, simulateFailure);
      setPaymentResult(result);
      if (result.success) {
        setTimeout(() => router.push("/orders?payment=success"), 3000);
      }
    } catch (error) {
      setPaymentResult({
        success: false,
        message: error instanceof Error ? error.message : "Payment failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── States ── */
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <AlertCircle size={48} style={{ color: "var(--text-secondary)", marginBottom: 16 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Sign In Required
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Please sign in to complete your payment.
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <Package size={48} style={{ color: "var(--text-secondary)", marginBottom: 16 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Order Not Found
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            The order you&apos;re trying to pay for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/orders")}
            style={{
              marginTop: 20,
              padding: "10px 22px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-juice)",
              color: "var(--color-core)",
              fontWeight: 600, fontSize: 14,
              border: "none", cursor: "pointer",
            }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (order.payment_status === "paid") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <CheckCircle size={56} style={{ color: "var(--color-jade)", marginBottom: 16 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Already Paid
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 20 }}>
            This order has already been paid for.
          </p>
          <button
            onClick={() => router.push("/orders")}
            style={{
              padding: "10px 22px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-juice)",
              color: "var(--color-core)",
              fontWeight: 600, fontSize: 14,
              border: "none", cursor: "pointer",
            }}
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {/* Back link */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/orders")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 500,
            marginBottom: 24, padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ArrowLeft size={16} /> Back to Orders
        </motion.button>

        {/* Page title */}
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 28 }}
        >
          Checkout
        </motion.h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* ── Left: Order Summary ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
              padding: 28,
              height: "fit-content",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Order Summary
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Order</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14 }}>
                #{order.id}
              </span>
            </div>

            {/* Items */}
            <div style={{
              borderTop: "1px solid var(--bg-page)",
              paddingTop: 16,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                      {item.product_name}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      Qty: {item.quantity} × ₹{item.unit_price}
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    ₹{item.total_price}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              borderTop: "1px solid var(--bg-page)",
              paddingTop: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Total</span>
              <span style={{
                fontSize: 20, fontWeight: 800, color: "var(--color-juice)",
                background: "var(--color-juice)" + "18",
                padding: "4px 12px", borderRadius: "var(--radius-sm)",
              }}>
                ₹{order.total_amount}
              </span>
            </div>
          </motion.div>

          {/* ── Right: Payment ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-card)",
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>
              Payment Method
            </h2>

            <AnimatePresence mode="wait">
              {!paymentResult ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Method selectors */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPayment === method.id;
                      return (
                        <motion.label
                          key={method.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            border: isSelected
                              ? "2px solid var(--color-juice)"
                              : "2px solid var(--bg-page)",
                            background: isSelected
                              ? "var(--color-juice)" + "12"
                              : "var(--bg-page)",
                            transition: "border 0.15s, background 0.15s",
                          }}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={isSelected}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            style={{ display: "none" }}
                          />
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: isSelected ? "var(--color-juice)" + "22" : "var(--bg-surface)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Icon size={16} style={{
                              color: isSelected ? "var(--color-juice)" : "var(--text-secondary)",
                            }} />
                          </div>
                          <div>
                            <p style={{
                              fontSize: 14, fontWeight: 600,
                              color: isSelected ? "var(--text-primary)" : "var(--text-primary)",
                            }}>
                              {method.name}
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                              {method.description}
                            </p>
                          </div>
                        </motion.label>
                      );
                    })}
                  </div>

                  {/* Test failure toggle */}
                  <label style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-heat)" + "10",
                    border: "1px solid var(--color-heat)" + "30",
                    cursor: "pointer",
                    marginBottom: 20,
                    fontSize: 13,
                    color: "var(--color-heat)",
                    fontWeight: 500,
                  }}>
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      style={{ accentColor: "var(--color-heat)", width: 14, height: 14 }}
                    />
                    Simulate payment failure (testing)
                  </label>

                  {/* Pay button */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "var(--shadow-hover)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={isProcessing}
                    style={{
                      width: "100%",
                      padding: "14px 24px",
                      borderRadius: "var(--radius-full)",
                      background: isProcessing ? "var(--text-secondary)" : "var(--color-juice)",
                      color: "var(--color-core)",
                      fontSize: 15,
                      fontWeight: 700,
                      border: "none",
                      cursor: isProcessing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "var(--shadow-button)",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Pay ₹{order.total_amount}
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: "center",
                    padding: "32px 20px",
                    borderRadius: "var(--radius-md)",
                    background: paymentResult.success
                      ? "var(--color-jade)" + "14"
                      : "var(--color-heat)" + "14",
                    border: `1px solid ${paymentResult.success
                      ? "var(--color-jade)"
                      : "var(--color-heat)"}44`,
                  }}
                >
                  {paymentResult.success ? (
                    <>
                      <CheckCircle size={52} style={{ color: "var(--color-jade)", margin: "0 auto 12px" }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        Payment Successful!
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>
                        {paymentResult.message}
                      </p>
                      {paymentResult.transaction_id && (
                        <p style={{
                          fontSize: 12, color: "var(--color-jade)", fontWeight: 500,
                          background: "var(--color-jade)" + "18",
                          padding: "4px 10px", borderRadius: "var(--radius-sm)",
                          display: "inline-block", marginBottom: 8,
                        }}>
                          TXN: {paymentResult.transaction_id}
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Redirecting to orders in 3s…
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={52} style={{ color: "var(--color-heat)", margin: "0 auto 12px" }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        Payment Failed
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                        {paymentResult.message}
                      </p>
                      <button
                        onClick={() => setPaymentResult(null)}
                        style={{
                          padding: "10px 22px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--color-heat)",
                          color: "#fff",
                          fontWeight: 600, fontSize: 14,
                          border: "none", cursor: "pointer",
                        }}
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}