import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

// Fix farmer names in listings that are stored as emails
router.post("/fix-farmer-names", async (_req, res) => {
  try {
    const db = getFirestore();

    // Get all listings
    const listingsSnap = await db.collection("listings").get();
    const listings = listingsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let updated = 0;
    const updates = [];

    // For each listing with email-like farmer name
    for (const listing of listings) {
      if (listing.farmerName && listing.farmerName.includes("@")) {
        try {
          // Fetch actual farmer name from users collection
          const farmerSnap = await db
            .collection("users")
            .doc(listing.farmerId)
            .get();

          if (farmerSnap.exists) {
            const farmerData = farmerSnap.data();
            // Get the actual name (not email)
            let actualName =
              farmerData.name || farmerData.email || listing.farmerName;

            // If the name is still an email, use a fallback
            if (actualName.includes("@")) {
              actualName = `Farmer (${listing.farmerId.substring(0, 8)})`;
            }

            // If the name is different, update the listing
            if (actualName !== listing.farmerName) {
              updates.push({
                id: listing.id,
                newName: actualName,
              });
              updated++;
            }
          }
        } catch (e) {
          console.warn(
            `Could not fix farmer name for listing ${listing.id}:`,
            e.message,
          );
        }
      }
    }

    // Apply updates
    for (const update of updates) {
      await db.collection("listings").doc(update.id).update({
        farmerName: update.newName,
      });
    }

    return res.json({
      success: true,
      message: `Updated ${updated} listings with corrected farmer names`,
      updated,
    });
  } catch (error) {
    console.error("Fix farmer names error:", error);
    return res.status(500).json({
      error: "fix_farmer_names_failed",
      message: "Failed to fix farmer names",
    });
  }
});

// Fix SHG names in listings that are missing or incomplete
router.post("/fix-shg-names", async (_req, res) => {
  try {
    const db = getFirestore();

    // Get all verified listings
    const listingsSnap = await db
      .collection("listings")
      .where("verificationStatus", "==", "verified")
      .get();

    const listings = listingsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let updated = 0;
    const updates = [];

    // For each listing with missing/empty SHG name
    for (const listing of listings) {
      if (!listing.verifiedByName || listing.verifiedByName.trim() === "") {
        if (listing.verifiedBy) {
          try {
            // Fetch actual SHG name from users collection
            const shgSnap = await db
              .collection("users")
              .doc(listing.verifiedBy)
              .get();

            if (shgSnap.exists) {
              const shgData = shgSnap.data();
              const actualName = shgData.name || shgData.email || "Unknown SHG";

              updates.push({
                id: listing.id,
                newName: actualName,
              });
              updated++;
            }
          } catch (e) {
            console.warn(
              `Could not fix SHG name for listing ${listing.id}:`,
              e.message,
            );
          }
        }
      }
    }

    // Apply updates
    for (const update of updates) {
      await db.collection("listings").doc(update.id).update({
        verifiedByName: update.newName,
      });
    }

    return res.json({
      success: true,
      message: `Updated ${updated} listings with corrected SHG names`,
      updated,
    });
  } catch (error) {
    console.error("Fix SHG names error:", error);
    return res.status(500).json({
      error: "fix_shg_names_failed",
      message: "Failed to fix SHG names",
    });
  }
});

export default router;
