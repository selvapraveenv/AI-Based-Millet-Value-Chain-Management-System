import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

// Get verifications for a specific SHG
router.get("", async (req, res) => {
  try {
    const shgId = String(req.query.shgId || "").trim();
    const statusFilter = String(req.query.status || "").trim(); // "verified", "rejected", or empty for all
    const startDate = req.query.startDate
      ? new Date(String(req.query.startDate))
      : null;
    const endDate = req.query.endDate
      ? new Date(String(req.query.endDate))
      : null;
    const milletType = String(req.query.milletType || "")
      .trim()
      .toLowerCase();
    const farmerName = String(req.query.farmerName || "")
      .trim()
      .toLowerCase();
    const taluk = String(req.query.taluk || "")
      .trim()
      .toLowerCase();

    if (!shgId) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["shgId"],
      });
    }

    const db = getFirestore();
    let verifications = [];

    try {
      // Try primary query with where + orderBy (requires composite index)
      let query = db.collection("verifications").where("shgId", "==", shgId);

      if (statusFilter && ["verified", "rejected"].includes(statusFilter)) {
        query = query.where("status", "==", statusFilter);
      }

      const snap = await query.orderBy("verifiedAt", "desc").get();
      verifications = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (indexError) {
      // Fallback: query without orderBy, then sort in code
      console.warn(
        "Composite index missing, using fallback query:",
        indexError.message,
      );

      let query = db.collection("verifications").where("shgId", "==", shgId);

      if (statusFilter && ["verified", "rejected"].includes(statusFilter)) {
        query = query.where("status", "==", statusFilter);
      }

      const snap = await query.get();
      verifications = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by verifiedAt descending
      verifications.sort((a, b) => {
        const aDate = a.verifiedAt?.toDate?.() || new Date(a.verifiedAt) || 0;
        const bDate = b.verifiedAt?.toDate?.() || new Date(b.verifiedAt) || 0;
        return bDate - aDate;
      });
    }

    // Apply client-side filters for date range and text searches
    verifications = verifications.filter((v) => {
      // Date range filter
      if (startDate && v.verifiedAt) {
        const verifiedDate = v.verifiedAt.toDate
          ? v.verifiedAt.toDate()
          : new Date(v.verifiedAt);
        if (verifiedDate < startDate) return false;
      }

      if (endDate && v.verifiedAt) {
        const verifiedDate = v.verifiedAt.toDate
          ? v.verifiedAt.toDate()
          : new Date(v.verifiedAt);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (verifiedDate > endOfDay) return false;
      }

      // Text filters
      if (
        milletType &&
        !String(v.milletType || "")
          .toLowerCase()
          .includes(milletType)
      ) {
        return false;
      }

      if (
        farmerName &&
        !String(v.farmerName || "")
          .toLowerCase()
          .includes(farmerName)
      ) {
        return false;
      }

      if (
        taluk &&
        !String(v.taluk || "")
          .toLowerCase()
          .includes(taluk)
      ) {
        return false;
      }

      return true;
    });

    console.log("🔍 GET Verifications - Query params:", {
      shgId,
      statusFilter,
      totalReturned: verifications.length,
    });

    // Log sample data to debug
    if (verifications.length > 0) {
      const sample = verifications[0];
      console.log(
        "📦 Sample verification data:",
        JSON.stringify(
          {
            id: sample.id,
            quantity: sample.quantity,
            quantityType: typeof sample.quantity,
            pricePerKg: sample.pricePerKg,
            priceType: typeof sample.pricePerKg,
            milletType: sample.milletType,
            farmerName: sample.farmerName,
            harvestDate: sample.harvestDate,
            status: sample.status,
          },
          null,
          2,
        ),
      );
    }

    // Serialize Firestore Timestamps to ISO strings for proper JSON serialization
    verifications = verifications.map((v) => {
      const serialized = { ...v };
      if (serialized.verifiedAt?.toDate) {
        serialized.verifiedAt = serialized.verifiedAt.toDate().toISOString();
      }
      if (serialized.createdAt?.toDate) {
        serialized.createdAt = serialized.createdAt.toDate().toISOString();
      }
      return serialized;
    });

    return res.json({
      success: true,
      verifications,
      stats: {
        total: verifications.length,
        verified: verifications.filter((v) => v.status === "verified").length,
        rejected: verifications.filter((v) => v.status === "rejected").length,
      },
    });
  } catch (error) {
    console.error("Get verifications error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_verifications",
      message: "Failed to fetch verifications",
    });
  }
});

// Get verification details by listing ID
router.get("/listing/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!listingId) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["listingId"],
      });
    }

    const db = getFirestore();
    const snap = await db
      .collection("verifications")
      .where("listingId", "==", listingId)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({
        success: true,
        verification: null,
      });
    }

    const doc = snap.docs[0];
    return res.json({
      success: true,
      verification: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Get verification by listing error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_verification",
      message: "Failed to fetch verification",
    });
  }
});

export default router;
