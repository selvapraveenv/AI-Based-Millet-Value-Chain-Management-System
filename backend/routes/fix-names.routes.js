import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

// Direct endpoint to fix email-like farmer names AND empty names in listings
router.post("/fix-email-names", async (_req, res) => {
  try {
    const db = getFirestore();

    // Get all listings
    const listingsSnap = await db.collection("listings").get();

    const updates = [];

    for (const doc of listingsSnap.docs) {
      const listing = doc.data();
      let shouldUpdate = false;
      let newName = listing.farmerName;

      // Check if farmer name looks like an email
      if (listing.farmerName && listing.farmerName.includes("@")) {
        // Extract the part before @
        const emailPart = listing.farmerName.split("@")[0];

        // Convert to readable name: "farmer.john" → "Farmer John", "farmer" → "Farmer"
        newName = emailPart
          .split(/[._-]/)
          .map(
            (part) =>
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
          )
          .join(" ");

        shouldUpdate = true;
      }
      // Check if farmer name is empty and fetch from users collection
      else if (!listing.farmerName || listing.farmerName.trim() === "") {
        try {
          const userDoc = await db
            .collection("users")
            .doc(listing.farmerId)
            .get();
          if (userDoc.exists && userDoc.data().name) {
            newName = userDoc.data().name;
            shouldUpdate = true;
          }
        } catch (err) {
          console.log(
            `Could not fetch user ${listing.farmerId}: ${err.message}`,
          );
        }
      }

      if (shouldUpdate) {
        console.log(
          `Updating listing ${doc.id}: "${listing.farmerName}" → "${newName}"`,
        );

        // Update the listing
        await doc.ref.update({
          farmerName: newName,
        });

        updates.push({
          listingId: doc.id,
          oldName: listing.farmerName,
          newName: newName,
        });
      }
    }

    return res.json({
      success: true,
      message: `Updated ${updates.length} listings with corrected farmer names`,
      updated: updates.length,
      details: updates,
    });
  } catch (error) {
    console.error("Fix email names error:", error);
    return res.status(500).json({
      error: "fix_email_names_failed",
      message: error.message,
    });
  }
});

export default router;
