/**
 * Order Routes - Handles order workflow logic
 *
 * Endpoints:
 * 1. POST /api/orders/update-status - Update order status with business logic
 */

import express from "express";
import { updateOrderStatus } from "../services/order.service.js";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const {
      listingId,
      buyerId,
      buyerName,
      buyerPhone,
      quantity,
      deliveryAddress,
    } = req.body || {};

    if (!listingId || !buyerId || !buyerName || !quantity || !deliveryAddress) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: [
          "listingId",
          "buyerId",
          "buyerName",
          "quantity",
          "deliveryAddress",
        ],
      });
    }

    const orderQuantity = Number(quantity);
    if (!orderQuantity || orderQuantity <= 0) {
      return res.status(400).json({ error: "invalid_quantity" });
    }

    const db = getFirestore();
    const orderResult = await db.runTransaction(async (tx) => {
      const listingRef = db.collection("listings").doc(String(listingId));
      const listingSnap = await tx.get(listingRef);

      if (!listingSnap.exists) {
        throw new Error("listing_not_found");
      }

      const listing = listingSnap.data();

      if (
        listing.verificationStatus !== "verified" ||
        listing.status !== "active"
      ) {
        throw new Error("listing_not_available");
      }

      const availableQty = Number(listing.quantity || 0);
      if (availableQty < orderQuantity) {
        throw new Error("insufficient_quantity");
      }

      const remainingQuantity = availableQty - orderQuantity;

      tx.update(listingRef, {
        quantity: remainingQuantity,
        status: remainingQuantity <= 0 ? "sold" : "active",
        updatedAt: new Date(),
      });

      const orderRef = db.collection("orders").doc();
      const pricePerKg = Number(listing.pricePerKg || 0);
      const orderPayload = {
        listingId: String(listingId),
        productName: listing.milletType || "Millet",
        buyerId: String(buyerId),
        buyerName: String(buyerName),
        buyerPhone: String(buyerPhone || ""),
        sellerId: String(listing.farmerId || ""),
        sellerName: String(listing.farmerName || ""),
        sellerPhone: String(listing.farmerPhone || ""),
        quantity: orderQuantity,
        unit: listing.unit || "kg",
        pricePerKg,
        totalPrice: orderQuantity * pricePerKg,
        status: "placed",
        orderDate: new Date(),
        deliveryAddress: String(deliveryAddress),
        statusHistory: [
          {
            status: "placed",
            timestamp: new Date(),
            userId: String(buyerId),
            userRole: "consumer",
            reason: null,
          },
        ],
      };

      tx.set(orderRef, orderPayload);

      return {
        id: orderRef.id,
        ...orderPayload,
      };
    });

    return res.status(201).json({ success: true, order: orderResult });
  } catch (error) {
    console.error("Create order error:", error);
    if (error.message === "listing_not_found") {
      return res.status(404).json({ error: "listing_not_found" });
    }
    if (error.message === "listing_not_available") {
      return res.status(400).json({ error: "listing_not_available" });
    }
    if (error.message === "insufficient_quantity") {
      return res.status(400).json({ error: "insufficient_quantity" });
    }
    return res.status(500).json({ error: "failed_to_create_order" });
  }
});

router.get("/buyer/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;
    const db = getFirestore();
    const snap = await db
      .collection("orders")
      .where("buyerId", "==", String(buyerId))
      .get();

    const orders = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.orderDate?.toDate?.()?.getTime?.() || 0;
        const bTime = b.orderDate?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      });

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Get buyer orders error:", error);
    return res.status(500).json({ error: "failed_to_fetch_orders" });
  }
});

router.post("/:orderId/pay", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, userRole, method } = req.body || {};

    if (!orderId || !userId || !userRole) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["orderId", "userId", "userRole"],
      });
    }

    if (String(userRole) !== "consumer") {
      return res.status(403).json({
        error: "forbidden",
        message: "Only consumers can complete payment",
      });
    }

    const db = getFirestore();
    const orderRef = db.collection("orders").doc(String(orderId));
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: "order_not_found" });
    }

    const order = orderSnap.data();

    if (String(order.buyerId || "") !== String(userId)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const currentStatus = String(order.status || "").toLowerCase();
    if (
      ![
        "confirmed",
        "payment_completed",
        "processing",
        "shipped",
        "delivered",
      ].includes(currentStatus)
    ) {
      return res.status(400).json({
        error: "payment_not_allowed_for_status",
        message: "Payment is allowed only after farmer confirms the order",
      });
    }

    const existingPaymentSnap = await db
      .collection("payments")
      .where("orderId", "==", String(orderId))
      .where("status", "==", "completed")
      .limit(1)
      .get();

    let paymentId = null;
    if (existingPaymentSnap.empty) {
      const paymentRef = await db.collection("payments").add({
        orderId: String(orderId),
        farmerId: String(order.sellerId || ""),
        farmerName: String(order.sellerName || ""),
        consumerId: String(order.buyerId || ""),
        consumerName: String(order.buyerName || ""),
        productName: String(order.productName || "Millet"),
        amount: Number(order.totalPrice || 0),
        method: String(method || "UPI"),
        status: "completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      paymentId = paymentRef.id;
    } else {
      paymentId = existingPaymentSnap.docs[0].id;
    }

    let updatedOrder = { ...order };
    if (currentStatus === "confirmed") {
      const history = Array.isArray(order.statusHistory)
        ? order.statusHistory
        : [];
      history.push({
        status: "payment_completed",
        timestamp: new Date(),
        userId: String(userId),
        userRole: "consumer",
        reason: null,
      });

      await orderRef.update({
        status: "payment_completed",
        paymentCompletedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: String(userId),
        statusHistory: history,
        lastStatusChange: {
          from: "confirmed",
          to: "payment_completed",
          timestamp: new Date(),
          userId: String(userId),
          userRole: "consumer",
          reason: null,
        },
      });

      updatedOrder = { ...order, status: "payment_completed" };
    }

    return res.json({
      success: true,
      message: "Payment completed successfully",
      paymentId,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Pay order error:", error);
    return res.status(500).json({ error: "failed_to_complete_payment" });
  }
});

router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const db = getFirestore();
    const snap = await db
      .collection("orders")
      .where("sellerId", "==", String(sellerId))
      .get();

    const orders = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.orderDate?.toDate?.()?.getTime?.() || 0;
        const bTime = b.orderDate?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      });

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Get seller orders error:", error);
    return res.status(500).json({ error: "failed_to_fetch_orders" });
  }
});

router.patch("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, userId, userRole, reason } = req.body || {};

    if (!orderId || !newStatus || !userId || !userRole) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["orderId", "newStatus", "userId", "userRole"],
      });
    }

    const result = await updateOrderStatus({
      orderId,
      newStatus,
      userId,
      userRole,
      reason,
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Patch order status error:", error);
    return res.status(400).json({
      error: "failed_to_update_status",
      message: error.message,
    });
  }
});

/**
 * POST /api/orders/update-status
 * Update order status with validation and business logic
 *
 * Body: {
 *   orderId: string
 *   newStatus: string ("placed", "confirmed", "processing", "shipped", "delivered", "cancelled")
 *   userId: string (user making the change)
 *   userRole: string ("farmer", "shg", "consumer", "admin")
 *   reason: string (optional, for cancellations)
 * }
 */
router.post("/update-status", async (req, res) => {
  try {
    const { orderId, newStatus, userId, userRole, reason } = req.body;

    // Validate input
    if (!orderId || !newStatus || !userId || !userRole) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["orderId", "newStatus", "userId", "userRole"],
      });
    }

    // Validate status value
    const validStatuses = [
      "placed",
      "confirmed",
      "payment_completed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses,
      });
    }

    // Update order status with business logic validation
    const result = await updateOrderStatus({
      orderId,
      newStatus,
      userId,
      userRole,
      reason,
    });

    res.json(result);
  } catch (error) {
    console.error("Order update error:", error);

    // Handle specific business logic errors
    if (
      error.message.includes("not allowed") ||
      error.message.includes("Invalid")
    ) {
      return res.status(403).json({
        error: "Status update not allowed",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to update order status",
      message: error.message,
    });
  }
});

export default router;
