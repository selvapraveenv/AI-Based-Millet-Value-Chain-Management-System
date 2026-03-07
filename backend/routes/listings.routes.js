import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

router.get("/verified", async (_req, res) => {
  try {
    const db = getFirestore();
    const snap = await db.collection("listings").get();

    const listings = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (listing) =>
          listing.verificationStatus === "verified" &&
          listing.status === "active" &&
          Number(listing.quantity || 0) > 0,
      );

    // Enrich listings with farmer names and SHG names from users collection
    // Also validate that farmers have role "farmer" and verifiers have role "shg"
    const enrichedListings = await Promise.all(
      listings.map(async (listing) => {
        const enriched = { ...listing };
        let isValidListing = true;

        // Fetch and validate farmer (must have role: farmer)
        try {
          const farmerSnap = await db
            .collection("users")
            .doc(listing.farmerId)
            .get();

          if (farmerSnap.exists) {
            const farmerData = farmerSnap.data();

            // Validate farmer role only if user exists
            if (farmerData.role === "farmer") {
              // Use the actual name from users collection
              enriched.farmerName = farmerData.name || enriched.farmerName;
            } else {
              // User exists but wrong role - exclude listing
              console.warn(
                `Listing ${listing.id}: farmerId ${listing.farmerId} has role "${farmerData.role}" instead of "farmer" - excluding`,
              );
              isValidListing = false;
            }
          }
          // If user doesn't exist, keep listing with stored farmerName
        } catch (e) {
          console.warn(
            `Could not fetch farmer for ${listing.farmerId}:`,
            e.message,
          );
          // Keep listing with stored farmerName
        }

        // Fetch and validate SHG verifier (must have role: shg)
        if (isValidListing && listing.verifiedBy) {
          try {
            const shgSnap = await db
              .collection("users")
              .doc(listing.verifiedBy)
              .get();

            if (shgSnap.exists) {
              const shgData = shgSnap.data();

              // Validate SHG role only if user exists
              if (shgData.role === "shg") {
                // Use the actual name from users collection
                enriched.verifiedByName = shgData.name || "Unknown SHG";
              } else {
                // User exists but wrong role - exclude listing
                console.warn(
                  `Listing ${listing.id}: verifiedBy ${listing.verifiedBy} has role "${shgData.role}" instead of "shg" - excluding`,
                );
                isValidListing = false;
              }
            }
            // If user doesn't exist, keep listing with stored verifiedByName
          } catch (e) {
            console.warn(
              `Could not fetch SHG for ${listing.verifiedBy}:`,
              e.message,
            );
            // Keep listing with stored verifiedByName
          }
        }

        // Mark invalid listings for filtering
        enriched._isValid = isValidListing;
        return enriched;
      }),
    );

    // Filter out invalid listings (where farmer is not role=farmer or verifier is not role=shg)
    const validListings = enrichedListings.filter(
      (listing) => listing._isValid !== false,
    );

    // Remove the internal _isValid flag before returning
    validListings.forEach((listing) => {
      delete listing._isValid;
      // Serialize Firestore Timestamps to ISO strings
      if (listing.createdAt?.toDate) {
        listing.createdAt = listing.createdAt.toDate().toISOString();
      }
      if (listing.verificationDate?.toDate) {
        listing.verificationDate = listing.verificationDate
          .toDate()
          .toISOString();
      }
    });

    return res.json({ success: true, listings: validListings });
  } catch (error) {
    console.error("Get verified listings error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_verified_listings",
      message: "Failed to fetch verified listings",
    });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const taluksQuery = String(req.query.taluks || "");
    const taluks = taluksQuery
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const db = getFirestore();
    const snap = await db
      .collection("listings")
      .where("verificationStatus", "==", "pending")
      .get();

    let listings = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((listing) => {
        if (taluks.length === 0) return true;
        return taluks.includes(
          String(listing.taluk || "")
            .toLowerCase()
            .trim(),
        );
      });

    // Enrich listings with farmer names
    listings = await Promise.all(
      listings.map(async (listing) => {
        const enriched = { ...listing };

        // Fetch farmer name from users collection if it looks like email or is missing
        const farmerNameLooksLikeEmail =
          enriched.farmerName && enriched.farmerName.includes("@");
        const farmerNameMissing =
          !enriched.farmerName || enriched.farmerName.trim() === "";

        if (farmerNameLooksLikeEmail || farmerNameMissing) {
          try {
            const farmerSnap = await db
              .collection("users")
              .doc(listing.farmerId)
              .get();
            if (farmerSnap.exists) {
              const farmerData = farmerSnap.data();
              // Use the actual name from users collection directly
              enriched.farmerName = farmerData.name || enriched.farmerName;
            }
          } catch (e) {
            console.warn(
              `Could not fetch farmer name for ${listing.farmerId}:`,
              e.message,
            );
          }
        }

        return enriched;
      }),
    );

    // Serialize Firestore Timestamps to ISO strings
    listings = listings.map((listing) => {
      if (listing.createdAt?.toDate) {
        listing.createdAt = listing.createdAt.toDate().toISOString();
      }
      if (listing.verificationDate?.toDate) {
        listing.verificationDate = listing.verificationDate
          .toDate()
          .toISOString();
      }
      return listing;
    });

    return res.json({ success: true, listings });
  } catch (error) {
    console.error("Get pending listings error:", error);
    return res.status(500).json({ error: "failed_to_fetch_pending_listings" });
  }
});

router.get("/shg-stats", async (req, res) => {
  try {
    const shgId = String(req.query.shgId || "").trim();
    const taluksQuery = String(req.query.taluks || "");
    const taluks = taluksQuery
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const db = getFirestore();
    const snap = await db.collection("listings").get();
    const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const pendingCount = listings.filter((listing) => {
      if (listing.verificationStatus !== "pending") return false;
      if (!taluks.length) return true;
      return taluks.includes(
        String(listing.taluk || "")
          .toLowerCase()
          .trim(),
      );
    }).length;

    const verifiedCount = listings.filter(
      (listing) =>
        listing.verifiedBy === shgId &&
        listing.verificationStatus === "verified",
    ).length;

    const rejectedCount = listings.filter(
      (listing) =>
        listing.verifiedBy === shgId &&
        listing.verificationStatus === "rejected",
    ).length;

    return res.json({
      success: true,
      stats: {
        pendingCount,
        verifiedCount,
        rejectedCount,
        totalReviewed: verifiedCount + rejectedCount,
      },
    });
  } catch (error) {
    console.error("Get SHG stats error:", error);
    return res.status(500).json({ error: "failed_to_fetch_shg_stats" });
  }
});

router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId) {
      return res.status(400).json({
        error: "Missing farmerId",
      });
    }

    const db = getFirestore();
    let listings = [];

    try {
      const snap = await db
        .collection("listings")
        .where("farmerId", "==", farmerId)
        .orderBy("createdAt", "desc")
        .get();

      listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (queryError) {
      console.warn(
        `Primary farmer listing query failed for ${farmerId}, using fallback query:`,
        queryError.message,
      );

      const fallbackSnap = await db
        .collection("listings")
        .where("farmerId", "==", farmerId)
        .get();

      listings = fallbackSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;
          const bDate = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;
          return bDate - aDate;
        });
    }

    // Enrich listings with SHG names
    listings = await Promise.all(
      listings.map(async (listing) => {
        const enriched = { ...listing };

        // Fetch SHG name from users collection if it's missing or empty
        const shgNameMissing =
          !enriched.verifiedByName || enriched.verifiedByName.trim() === "";
        if (shgNameMissing && listing.verifiedBy) {
          try {
            const shgSnap = await db
              .collection("users")
              .doc(listing.verifiedBy)
              .get();
            if (shgSnap.exists) {
              const shgData = shgSnap.data();
              // Use the actual name from users collection directly
              enriched.verifiedByName = shgData.name || "Unknown SHG";
            }
          } catch (e) {
            console.warn(
              `Could not fetch SHG name for ${listing.verifiedBy}:`,
              e.message,
            );
          }
        }

        // Serialize Firestore Timestamps to ISO strings for proper JSON serialization
        if (enriched.createdAt?.toDate) {
          enriched.createdAt = enriched.createdAt.toDate().toISOString();
        }
        if (enriched.verificationDate?.toDate) {
          enriched.verificationDate = enriched.verificationDate
            .toDate()
            .toISOString();
        }

        return enriched;
      }),
    );

    return res.json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error("Get farmer listings error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_listings",
      message: "Failed to fetch farmer listings",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      farmerId,
      farmerName,
      farmerPhone,
      milletType,
      quantity,
      unit,
      location,
      taluk,
      pricePerKg,
      priceUnit,
      status,
      quality,
      harvestDate,
      verificationStatus,
      verifiedBy,
      verifiedByName,
      verifiedImage,
      verificationDate,
      verificationNotes,
    } = req.body || {};

    if (
      !farmerId ||
      !farmerName ||
      !milletType ||
      !quantity ||
      !location ||
      !taluk ||
      !pricePerKg
    ) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: [
          "farmerId",
          "farmerName",
          "milletType",
          "quantity",
          "location",
          "taluk",
          "pricePerKg",
        ],
      });
    }

    const db = getFirestore();
    const payload = {
      farmerId: String(farmerId),
      farmerName: String(farmerName),
      farmerPhone: String(farmerPhone || ""),
      milletType: String(milletType),
      quantity: Number(quantity),
      unit: String(unit || "kg"),
      location: String(location),
      taluk: String(taluk),
      pricePerKg: Number(pricePerKg),
      priceUnit: String(priceUnit || "kg"),
      status: status || "active",
      quality: String(quality || "Grade A"),
      harvestDate: String(harvestDate || ""),
      verificationStatus: verificationStatus || "pending",
      verifiedBy: String(verifiedBy || ""),
      verifiedByName: String(verifiedByName || ""),
      verifiedImage: String(verifiedImage || ""),
      verificationDate: verificationDate || null,
      verificationNotes: String(verificationNotes || ""),
      createdAt: new Date(),
    };

    const ref = await db.collection("listings").add(payload);

    return res.status(201).json({
      success: true,
      id: ref.id,
      listing: {
        id: ref.id,
        ...payload,
      },
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return res.status(500).json({
      error: "failed_to_create_listing",
      message: "Failed to create listing",
    });
  }
});

router.patch("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { farmerId, quantity, pricePerKg } = req.body || {};

    if (!listingId || !farmerId) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["listingId", "farmerId"],
      });
    }

    const db = getFirestore();
    const docRef = db.collection("listings").doc(listingId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "listing_not_found" });
    }

    const listing = docSnap.data();
    if (listing.farmerId !== farmerId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const updates = {};
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (pricePerKg !== undefined) updates.pricePerKg = Number(pricePerKg);

    await docRef.update(updates);

    return res.json({ success: true });
  } catch (error) {
    console.error("Update listing error:", error);
    return res.status(500).json({
      error: "failed_to_update_listing",
      message: "Failed to update listing",
    });
  }
});

router.post("/:listingId/verify", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { shgId, shgName, status, notes, imageUrl } = req.body || {};

    if (!listingId || !shgId || !shgName || !status) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["listingId", "shgId", "shgName", "status"],
      });
    }

    if (!["verified", "rejected"].includes(String(status))) {
      return res.status(400).json({ error: "invalid_status" });
    }

    const db = getFirestore();
    const docRef = db.collection("listings").doc(listingId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "listing_not_found" });
    }

    const listing = docSnap.data();

    // Log the listing data to debug
    console.log("📋 Verifying listing:", listingId);
    console.log("📦 Listing data:", JSON.stringify(listing, null, 2));

    // Update the listing document with verification details
    const updateData = {
      verificationStatus: String(status),
      verifiedBy: String(shgId),
      verifiedByName: String(shgName),
      verifiedImage: String(imageUrl || "/placeholder.jpg"),
      verificationDate: new Date(),
      verificationNotes: String(notes || ""),
    };

    await docRef.update(updateData);

    // Create verification document with COMPLETE data from listing
    // Use proper type conversions to handle any data format
    const verificationData = {
      listingId: String(listingId),
      farmerId: String(listing.farmerId || ""),
      farmerName: String(listing.farmerName || "Unknown Farmer"),
      farmerPhone: String(listing.farmerPhone || ""),
      milletType: String(listing.milletType || "Unknown Millet"),
      quantity: Number(listing.quantity) || 0,
      unit: String(listing.unit || "kg"),
      location: String(listing.location || ""),
      taluk: String(listing.taluk || ""),
      pricePerKg: Number(listing.pricePerKg) || 0,
      priceUnit: String(listing.priceUnit || "kg"),
      quality: String(listing.quality || "Grade A"),
      harvestDate: String(listing.harvestDate || ""),
      shgId: String(shgId),
      shgName: String(shgName),
      status: String(status),
      verifiedImage: String(imageUrl || "/placeholder.jpg"),
      notes: String(notes || ""),
      verifiedAt: new Date(),
      createdAt: new Date(),
    };

    console.log(
      "✅ Creating verification with data:",
      JSON.stringify(verificationData, null, 2),
    );

    const verificationRef = await db
      .collection("verifications")
      .add(verificationData);

    console.log("✅ Verification created:", verificationRef.id);

    return res.json({
      success: true,
      verificationId: verificationRef.id,
      message: `Listing ${status} successfully`,
    });
  } catch (error) {
    console.error("❌ Verify listing error:", error);
    return res.status(500).json({
      error: "failed_to_verify_listing",
      message: error.message,
    });
  }
});

router.delete("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;
    const { farmerId } = req.query;

    if (!listingId || !farmerId) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["listingId", "farmerId"],
      });
    }

    const db = getFirestore();
    const docRef = db.collection("listings").doc(listingId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "listing_not_found" });
    }

    const listing = docSnap.data();
    if (listing.farmerId !== farmerId) {
      return res.status(403).json({ error: "forbidden" });
    }

    await docRef.delete();

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete listing error:", error);
    return res.status(500).json({
      error: "failed_to_delete_listing",
      message: "Failed to delete listing",
    });
  }
});

export default router;
