import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

// Endpoint to manually create missing farmer and fix listing
router.post("/create-and-fix-listing", async (_req, res) => {
  try {
    const db = getFirestore();
    const farmerId = "sOqOqS6fji1N4goeNTuY";
    const listingId = "uuvY7mRDmspA6wfzJNb9";

    // Check if farmer exists
    const farmerDoc = await db.collection("users").doc(farmerId).get();
    let farmerName = "Unknown Farmer";

    if (farmerDoc.exists) {
      farmerName =
        farmerDoc.data().name || farmerDoc.data().email || "Unknown Farmer";
    } else {
      // Create the farmer if doesn't exist
      await db
        .collection("users")
        .doc(farmerId)
        .set({
          name: "Default Farmer",
          email: `farmer.${farmerId.slice(-4)}@milletchain.com`,
          role: "farmer",
          phone: "7027",
          location: "Dharapuram",
          status: "approved",
          createdAt: new Date(),
        });
      farmerName = "Default Farmer";
    }

    // Update the listing with farmer name
    await db.collection("listings").doc(listingId).update({
      farmerName: farmerName,
    });

    return res.json({
      success: true,
      message: "Fixed listing with farmer name",
      listingId: listingId,
      farmerId: farmerId,
      newFarmerName: farmerName,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: "create_and_fix_failed",
      message: error.message,
    });
  }
});

export default router;
