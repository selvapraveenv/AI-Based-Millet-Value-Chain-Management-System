import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Get all payments for a farmer (seller)
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    const db = getFirestore();
    let payments = [];

    try {
      const snap = await db
        .collection("payments")
        .where("farmerId", "==", String(farmerId))
        .orderBy("createdAt", "desc")
        .get();

      payments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (_indexError) {
      const snap = await db
        .collection("payments")
        .where("farmerId", "==", String(farmerId))
        .get();

      payments = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aDate = toDate(a.createdAt)?.getTime() || 0;
          const bDate = toDate(b.createdAt)?.getTime() || 0;
          return bDate - aDate;
        });
    }

    // Calculate stats
    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");

    const totalEarnings = completed.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    const pendingPayments = pending.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );

    // Calculate this month earnings
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = completed
      .filter((p) => {
        const paymentDate = toDate(p.createdAt);
        if (!paymentDate) return false;
        return paymentDate >= thisMonthStart;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      success: true,
      payments,
      stats: {
        totalEarnings,
        pendingPayments,
        thisMonth,
      },
    });
  } catch (error) {
    console.error("Get farmer payments error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_payments",
      message: "Failed to fetch farmer payments",
    });
  }
});

// Get all payments for a consumer (buyer)
router.get("/consumer/:consumerId", async (req, res) => {
  try {
    const { consumerId } = req.params;
    const db = getFirestore();
    let payments = [];

    try {
      const snap = await db
        .collection("payments")
        .where("consumerId", "==", String(consumerId))
        .orderBy("createdAt", "desc")
        .get();

      payments = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (_indexError) {
      const snap = await db
        .collection("payments")
        .where("consumerId", "==", String(consumerId))
        .get();

      payments = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aDate = toDate(a.createdAt)?.getTime() || 0;
          const bDate = toDate(b.createdAt)?.getTime() || 0;
          return bDate - aDate;
        });
    }

    // Calculate stats
    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");

    const totalSpent = completed.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingTransactions = pending.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );

    // Calculate this month spending
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = completed
      .filter((p) => {
        const paymentDate = toDate(p.createdAt);
        if (!paymentDate) return false;
        return paymentDate >= thisMonthStart;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      success: true,
      payments,
      stats: {
        totalSpent,
        pendingTransactions,
        thisMonth,
      },
    });
  } catch (error) {
    console.error("Get consumer payments error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_payments",
      message: "Failed to fetch consumer payments",
    });
  }
});

// Create a new payment record
router.post("/create", async (req, res) => {
  try {
    const {
      orderId,
      farmerId,
      farmerName,
      consumerId,
      consumerName,
      productName,
      amount,
      method,
      status,
    } = req.body || {};

    if (!orderId || !farmerId || !consumerId || !amount) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["orderId", "farmerId", "consumerId", "amount"],
      });
    }

    const db = getFirestore();
    const paymentRef = await db.collection("payments").add({
      orderId: String(orderId),
      farmerId: String(farmerId),
      farmerName: String(farmerName || ""),
      consumerId: String(consumerId),
      consumerName: String(consumerName || ""),
      productName: String(productName || ""),
      amount: Number(amount),
      method: String(method || "UPI"),
      status: String(status || "pending"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      paymentId: paymentRef.id,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      error: "failed_to_create_payment",
      message: "Failed to create payment record",
    });
  }
});

// Update payment status
router.patch("/:paymentId/status", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body || {};

    if (!paymentId || !status) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["status"],
      });
    }

    if (!["pending", "completed", "failed"].includes(status)) {
      return res.status(400).json({
        error: "invalid_status",
        message: "Status must be 'pending', 'completed', or 'failed'",
      });
    }

    const db = getFirestore();
    await db
      .collection("payments")
      .doc(String(paymentId))
      .update({
        status: String(status),
        updatedAt: new Date(),
      });

    return res.json({
      success: true,
      message: "Payment status updated",
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({
      error: "failed_to_update_payment",
      message: "Failed to update payment status",
    });
  }
});

export default router;
