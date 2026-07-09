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
  IndianRupee,
  ShoppingBag,
} from "lucide-react";

/* ── Status maps aligned to design.md signal colors ── */
const statusIcons = {
  pending:    Clock,
  placed:     Package,
  confirmed:  CheckCircle,
  processing: Package,
  shipped:    Truck,
  delivered:  CheckCircle,
  cancelled:  XCircle,
  refunded:   RotateCcw,
};

const statusColors: Record<string, string> = {
  pending:    "var(--color-sky)",
  placed:     "var(--color-sky)",
  confirmed:  "var(--color-jade)",
  processing: "var(--color-sky)",
  shipped:    "var(--color-jade)",
  delivered:  "var(--color-jade)",
  cancelled:  "var(--color-heat)",
  refunded:   "var(--text-secondary)",
};

const paymentColors: Record<string, string> = {
  pending:        "var(--color-sky)",
  paid:           "var(--color-jade)",
  failed:         "var(--color-heat)",
  refunded:       "var(--text-secondary)",
  partially_paid: "var(--color-sky)",
};

const statConfig = [
  { key: "total_orders",     label: "Total Orders", icon: ShoppingBag,  accent: "var(--color-sky)"   },
  { key: "pending_orders",   label: "Pending",       icon: Clock,         accent: "var(--color-juice)" },
  { key: "completed_orders", label: "Completed",     icon: CheckCircle,   accent: "var(--color-jade)"  },
  { key: "total_spent",      label: "Total Spent",   icon: IndianRupee,   accent: "var(--color-juice)", rupee: true },
] as const;

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <div className="animate-spin" style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid var(--bg-surface-alt)",
        borderTopColor: "var(--color-juice)",
      }} />
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, error, cancelOrder, reorder, getOrderSummary } = useOrders();
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getOrderSummary().then(setSummary).catch(console.error);
    }
  }, [user]);

  const handleCancelOrder = async (orderId: number) => {
    setActionLoading(orderId);
    try { await cancelOrder(orderId); }
    catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleReorder = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const newOrder = await reorder(orderId);
      alert(`New order created — #${newOrder.id}`);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
            background: "var(--bg-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-card)",
          }}>
            <AlertCircle size={32} style={{ color: "var(--text-secondary)" }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Sign In Required
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Please sign in to view your orders.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !orders.length) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingTop: "96px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            My Orders
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Track and manage all your orders
          </p>
        </motion.div>

        {/* ── Summary Stat Cards ── */}
        {summary && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}>
            {statConfig.map(({ key, label, icon: Icon, accent, rupee }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2, boxShadow: "var(--shadow-hover)" }}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "default",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: accent + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    marginBottom: 2,
                  }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    {rupee ? `₹${summary[key as keyof OrderSummary]}` : summary[key as keyof OrderSummary]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Orders List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: "center",
                padding: "64px 24px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: "50%", margin: "0 auto 18px",
                background: "var(--bg-page)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Package size={32} style={{ color: "var(--text-secondary)" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                No orders yet
              </h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 22, fontSize: 14 }}>
                Start shopping to see your orders here!
              </p>
              <a
                href="/products"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "11px 22px",
                  background: "var(--color-juice)",
                  color: "var(--color-core)",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 600, fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "var(--shadow-button)",
                }}
              >
                Browse Products
              </a>
            </motion.div>
          ) : (
            orders.map((order, i) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons] || Package;
              const statusColor = statusColors[order.status] || "var(--text-secondary)";
              const paymentColor = paymentColors[order.payment_status] || "var(--text-secondary)";
              const canCancel = order.status === "pending";
              const canPay = order.payment_status === "pending";

              return (
                /* ── Single white card per order — design.md §1b ── */
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-card)",
                    overflow: "hidden",
                  }}
                >
                  {/* ── Order header row — separated by divider, NOT background ── */}
                  <div style={{
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: statusColor + "22",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <StatusIcon size={17} style={{ color: statusColor }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                          Order #{order.id}
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        ₹{order.total_amount}
                      </p>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "var(--radius-sm)",
                          fontSize: 11, fontWeight: 600,
                          background: statusColor + "22", color: statusColor,
                          textTransform: "capitalize",
                        }}>
                          {order.status}
                        </span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: "var(--radius-sm)",
                          fontSize: 11, fontWeight: 600,
                          background: paymentColor + "22", color: paymentColor,
                          textTransform: "capitalize",
                        }}>
                          <CreditCard size={10} />
                          {order.payment_status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Item rows — plain divider, no background swap ── */}
                  <div style={{ borderTop: "var(--divider-row)", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {order.items.map((item, idx) => (
                      <div key={item.id}>
                        {idx > 0 && (
                          <div style={{ borderTop: "var(--divider-row)", marginBottom: 12 }} />
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: "var(--radius-md)",
                            background: "var(--bg-page)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, overflow: "hidden",
                          }}>
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Package size={20} style={{ color: "var(--text-secondary)" }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                              {item.product_name}
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                              {item.quantity} × ₹{item.unit_price}
                            </p>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                            ₹{item.total_price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Action row — plain divider, no background swap ── */}
                  {(canCancel || canPay || true) && (
                    <div style={{
                      borderTop: "var(--divider-row)",
                      padding: "12px 24px",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      flexWrap: "wrap",
                    }}>
                      {canCancel && (
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={actionLoading === order.id}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-full)",
                            fontSize: 13, fontWeight: 600,
                            border: "none", cursor: actionLoading === order.id ? "not-allowed" : "pointer",
                            opacity: actionLoading === order.id ? 0.5 : 1,
                            background: "var(--color-heat)" + "22",
                            color: "var(--color-heat)",
                          }}
                        >
                          {actionLoading === order.id ? "Cancelling…" : "Cancel Order"}
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleReorder(order.id)}
                        disabled={actionLoading === order.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 13, fontWeight: 600,
                          border: "none", cursor: actionLoading === order.id ? "not-allowed" : "pointer",
                          opacity: actionLoading === order.id ? 0.5 : 1,
                          background: "var(--color-jade)" + "22",
                          color: "var(--color-jade)",
                        }}
                      >
                        {actionLoading === order.id ? "Reordering…" : "Reorder"}
                      </motion.button>

                      {canPay && (
                        <motion.a
                          href={`/checkout/${order.id}`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "8px 18px",
                            borderRadius: "var(--radius-full)",
                            fontSize: 13, fontWeight: 700,
                            textDecoration: "none",
                            background: "var(--color-juice)",
                            color: "var(--color-core)",
                            boxShadow: "var(--shadow-button)",
                          }}
                        >
                          <CreditCard size={13} />
                          Pay Now
                        </motion.a>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 20,
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-heat)" + "18",
              border: "1px solid var(--color-heat)" + "44",
              display: "flex", alignItems: "flex-start", gap: 10,
            }}
          >
            <AlertCircle size={16} style={{ color: "var(--color-heat)", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "var(--color-heat)" }}>{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}