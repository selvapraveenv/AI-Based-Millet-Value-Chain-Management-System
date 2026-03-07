import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = getFirestore();
    const role = String(req.query.role || "").trim();

    let queryRef = db.collection("users");
    if (role && role !== "all") {
      queryRef = queryRef.where("role", "==", role);
    }

    const snap = await queryRef.get();
    const users = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return bTime - aTime;
      });

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_users",
      message: "Failed to fetch users",
    });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "missing_user_id" });
    }

    const db = getFirestore();
    const docSnap = await db.collection("users").doc(userId).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "user_not_found" });
    }

    const user = { id: docSnap.id, ...docSnap.data() };
    return res.json({ success: true, user });
  } catch (error) {
    console.error("Get user by id error:", error);
    return res.status(500).json({
      error: "failed_to_fetch_user",
      message: "Failed to fetch user",
    });
  }
});

router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, email, district, state, taluk, assignedTaluks } =
      req.body;

    if (!userId) {
      return res.status(400).json({ error: "missing_user_id" });
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "user_not_found" });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;
    if (taluk !== undefined) updateData.taluk = taluk;
    if (assignedTaluks !== undefined)
      updateData.assignedTaluks = assignedTaluks;
    updateData.updatedAt = new Date();

    await userRef.update(updateData);

    // Return updated user
    const updatedSnap = await userRef.get();
    const updatedUser = { id: updatedSnap.id, ...updatedSnap.data() };

    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      error: "failed_to_update_user",
      message: "Failed to update user profile",
    });
  }
});

router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "missing_user_id" });
    }

    const db = getFirestore();
    await db.collection("users").doc(userId).delete();

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      error: "failed_to_delete_user",
      message: "Failed to delete user",
    });
  }
});

export default router;
