import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/summary", async (_req, res) => {
  try {
    const db = getFirestore();
    const [usersSnap, listingsSnap, ordersSnap, disputesSnap, paymentsSnap] =
      await Promise.all([
        db.collection("users").get(),
        db.collection("listings").get(),
        db.collection("orders").get(),
        db.collection("disputes").get(),
        db.collection("payments").get(),
      ]);

    const users = usersSnap.docs.map((d) => d.data());
    const listings = listingsSnap.docs.map((d) => d.data());
    const orders = ordersSnap.docs.map((d) => d.data());
    const disputes = disputesSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());

    return res.json({
      success: true,
      stats: {
        totalFarmers: users.filter((u) => u.role === "farmer").length,
        totalSHGs: users.filter((u) => u.role === "shg").length,
        totalConsumers: users.filter((u) => u.role === "consumer").length,
        verifiedListings: listings.filter(
          (l) => l.verificationStatus === "verified",
        ).length,
        pendingVerifications: listings.filter(
          (l) => l.verificationStatus === "pending",
        ).length,
        openSupportIssues: disputes.filter(
          (d) => String(d.category || "") === "system" && d.status === "open",
        ).length,
        totalOrders: orders.length,
        totalPayments: payments.length,
        completedPayments: payments.filter((p) => p.status === "completed")
          .length,
      },
    });
  } catch (error) {
    console.error("Admin summary error:", error);
    return res.status(500).json({ error: "failed_to_fetch_summary" });
  }
});

router.get("/analytics", async (_req, res) => {
  try {
    const db = getFirestore();
    const [usersSnap, listingsSnap, ordersSnap, paymentsSnap] =
      await Promise.all([
        db.collection("users").get(),
        db.collection("listings").get(),
        db.collection("orders").get(),
        db.collection("payments").get(),
      ]);

    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const totalRevenue = payments
      .filter((payment) => payment.status === "completed")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const verifiedCrops = listings.filter(
      (l) => l.verificationStatus === "verified",
    ).length;

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: getMonthKey(d),
        month: d.toLocaleString("en-US", { month: "short" }),
      });
    }

    const monthlyData = months.map((month) => {
      const farmerCount = users.filter((u) => {
        if (u.role !== "farmer") return false;
        const created = toDate(u.createdAt);
        return created ? getMonthKey(created) === month.key : false;
      }).length;

      const orderCount = orders.filter((o) => {
        const orderDate = toDate(o.orderDate || o.createdAt);
        return orderDate ? getMonthKey(orderDate) === month.key : false;
      }).length;

      return {
        month: month.month,
        farmers: farmerCount,
        orders: orderCount,
      };
    });

    const revenueData = months.map((month) => {
      const revenue = payments
        .filter((payment) => {
          if (payment.status !== "completed") return false;
          const paymentDate = toDate(payment.createdAt || payment.updatedAt);
          return paymentDate ? getMonthKey(paymentDate) === month.key : false;
        })
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      return { month: month.month, revenue };
    });

    const milletMap = {};
    listings.forEach((listing) => {
      const key = listing.milletType || "Unknown";
      milletMap[key] = (milletMap[key] || 0) + 1;
    });

    const milletTotal =
      Object.values(milletMap).reduce((a, b) => a + b, 0) || 1;
    const milletDistribution = Object.entries(milletMap).map(
      ([name, value]) => ({
        name,
        value: Math.round((value / milletTotal) * 100),
      }),
    );

    const regionMap = {};
    users
      .filter((u) => u.role === "farmer")
      .forEach((farmer) => {
        const district = farmer.district || "Unknown";
        regionMap[district] = (regionMap[district] || 0) + 1;
      });

    const regionData = Object.entries(regionMap).map(([region, farmers]) => ({
      region,
      farmers,
    }));

    return res.json({
      success: true,
      analytics: {
        totalRevenue,
        revenueGrowth: 0,
        activeUsers: users.length,
        userGrowth: 0,
        verifiedCrops,
        cropGrowth: 0,
        totalOrders: orders.length,
        orderGrowth: 0,
        totalPayments: payments.length,
        completedPayments: payments.filter(
          (payment) => payment.status === "completed",
        ).length,
        pendingPayments: payments.filter(
          (payment) => payment.status === "pending",
        ).length,
        monthlyData,
        milletDistribution,
        revenueData,
        regionData,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({ error: "failed_to_fetch_analytics" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const db = getFirestore();
    const limit = Math.max(1, Number(req.query.limit || 20));
    const snap = await db.collection("orders").get();

    const orders = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = toDate(a.orderDate || a.createdAt)?.getTime() || 0;
        const bTime = toDate(b.orderDate || b.createdAt)?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return res.json({ success: true, orders });
  } catch (error) {
    console.error("Admin orders error:", error);
    return res.status(500).json({ error: "failed_to_fetch_orders" });
  }
});

router.get("/disputes", async (req, res) => {
  try {
    const db = getFirestore();
    const status = String(req.query.status || "").trim();

    let queryRef = db.collection("disputes").where("category", "==", "system");
    if (status) queryRef = queryRef.where("status", "==", status);

    const snap = await queryRef.get();
    const disputes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Admin support issues error:", error);
    return res.status(500).json({ error: "failed_to_fetch_support_issues" });
  }
});

router.patch("/disputes/:disputeId", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { status, resolution, updatedBy, updatedByName } = req.body || {};

    if (!disputeId || !status) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["disputeId", "status"],
      });
    }

    const allowedStatuses = ["open", "in_progress", "resolved", "closed"];
    if (!allowedStatuses.includes(String(status))) {
      return res.status(400).json({
        error: "invalid_status",
        allowedStatuses,
      });
    }

    const db = getFirestore();
    const disputeRef = db.collection("disputes").doc(String(disputeId));
    const disputeSnap = await disputeRef.get();

    if (!disputeSnap.exists) {
      return res.status(404).json({ error: "dispute_not_found" });
    }

    const current = disputeSnap.data() || {};
    if (String(current.category || "") !== "system") {
      return res.status(400).json({
        error: "invalid_dispute_category",
        message: "Admin endpoint only handles system support issues",
      });
    }

    const updatePayload = {
      status: String(status),
      resolution: String(resolution || ""),
      updatedAt: new Date(),
      updatedBy: String(updatedBy || ""),
      updatedByName: String(updatedByName || ""),
      ...(String(status) === "resolved" ? { resolvedAt: new Date() } : {}),
    };

    await disputeRef.update(updatePayload);

    return res.json({
      success: true,
      message: "Dispute updated successfully",
    });
  } catch (error) {
    console.error("Admin dispute update error:", error);
    return res.status(500).json({ error: "failed_to_update_dispute" });
  }
});

export default router;
