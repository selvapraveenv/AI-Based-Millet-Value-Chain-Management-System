import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

// Endpoint to inspect raw listings data in Firestore
router.get("/listing/:id", async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection("listings").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json({
      id: doc.id,
      data: doc.data(),
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to inspect all listings (raw, no enrichment)
router.get("/all-raw", async (_req, res) => {
  try {
    const db = getFirestore();
    const listingsSnap = await db.collection("listings").get();

    const listings = [];
    listingsSnap.forEach((doc) => {
      listings.push({
        id: doc.id,
        farmerId: doc.data().farmerId,
        farmerName: doc.data().farmerName,
        cropType: doc.data().milletType,
        hasEmail: doc.data().farmerName && doc.data().farmerName.includes("@"),
        isEmpty: !doc.data().farmerName || doc.data().farmerName.trim() === "",
      });
    });

    return res.json({ listings });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
