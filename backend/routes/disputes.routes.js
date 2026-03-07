import express from "express";
import { getFirestore, getStorageBucket } from "../config/firebase.js";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?._seconds === "number") return new Date(value._seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDispute(dispute) {
  return {
    ...dispute,
    createdAt: toDate(dispute.createdAt)?.toISOString() || null,
    updatedAt: toDate(dispute.updatedAt)?.toISOString() || null,
    resolvedAt: toDate(dispute.resolvedAt)?.toISOString() || null,
    messages: Array.isArray(dispute.messages)
      ? dispute.messages.map((m) => ({
          ...m,
          createdAt: toDate(m.createdAt)?.toISOString() || null,
        }))
      : [],
  };
}

async function saveAttachment(req, orderId) {
  let proofVideoUrl = "";
  let proofFileName = "";
  let proofFileType = "";
  let proofFileSize = 0;

  if (!req.file) {
    return { proofVideoUrl, proofFileName, proofFileType, proofFileSize };
  }

  proofFileName = req.file.originalname;
  proofFileType = req.file.mimetype;
  proofFileSize = req.file.size;

  try {
    const bucket = getStorageBucket();
    const timestamp = Date.now();
    const fileName = `disputes/${orderId}/${timestamp}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "01-01-2500",
    });

    proofVideoUrl = signedUrl;
  } catch (uploadError) {
    console.warn("?? Firebase upload failed, using local fallback:", uploadError?.message);
    const timestamp = Date.now();
    const sanitizedName = String(req.file.originalname || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
    const relativeDir = path.join("uploads", "disputes", String(orderId));
    const absoluteDir = path.join(process.cwd(), relativeDir);
    await fs.mkdir(absoluteDir, { recursive: true });

    const localFileName = `${timestamp}-${sanitizedName}`;
    const absoluteFilePath = path.join(absoluteDir, localFileName);
    await fs.writeFile(absoluteFilePath, req.file.buffer);

    const backendBaseUrl = `${req.protocol}://${req.get("host")}`;
    proofVideoUrl = `${backendBaseUrl}/uploads/disputes/${orderId}/${localFileName}`;
    console.log(`? Attachment saved locally: ${absoluteFilePath}`);
  }

  return { proofVideoUrl, proofFileName, proofFileType, proofFileSize };
}

router.get("/consumer/:consumerId", async (req, res) => {
  try {
    const { consumerId } = req.params;
    if (!consumerId) {
      return res.status(400).json({ error: "missing_required_fields", required: ["consumerId"] });
    }

    const db = getFirestore();
    const snap = await db.collection("disputes").get();

    const disputes = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((d) =>
        String(d.consumerId || "") === String(consumerId) ||
        String(d.raisedById || "") === String(consumerId)
      )
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
      .map(serializeDispute);

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Get consumer disputes error:", error);
    return res.status(500).json({ error: "failed_to_fetch_consumer_disputes" });
  }
});

router.get("/shg/:shgId", async (req, res) => {
  try {
    const { shgId } = req.params;
    if (!shgId) {
      return res.status(400).json({ error: "missing_required_fields", required: ["shgId"] });
    }

    const db = getFirestore();
    const snap = await db.collection("disputes").get();

    const disputes = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((d) =>
        String(d.category || "product") === "product" &&
        String(d.assignedToRole || "") === "shg" &&
        String(d.assignedToId || "") === String(shgId)
      )
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
      .map(serializeDispute);

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Get SHG disputes error:", error);
    return res.status(500).json({ error: "failed_to_fetch_shg_disputes" });
  }
});

router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    if (!farmerId) {
      return res.status(400).json({ error: "missing_required_fields", required: ["farmerId"] });
    }

    const db = getFirestore();
    const snap = await db.collection("disputes").get();

    const disputes = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((d) =>
        String(d.category || "product") === "product" &&
        String(d.farmerId || "") === String(farmerId)
      )
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
      .map(serializeDispute);

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Get farmer disputes error:", error);
    return res.status(500).json({ error: "failed_to_fetch_farmer_disputes" });
  }
});

router.get("/admin/system", async (req, res) => {
  try {
    const statusFilter = String(req.query.status || "").trim();
    const db = getFirestore();
    const snap = await db.collection("disputes").get();

    let disputes = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((d) => String(d.category || "") === "system");

    if (statusFilter) {
      disputes = disputes.filter((d) => String(d.status || "") === statusFilter);
    }

    disputes = disputes
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
      .map(serializeDispute);

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Get admin system disputes error:", error);
    return res.status(500).json({ error: "failed_to_fetch_admin_system_disputes" });
  }
});

router.get("/raised/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getFirestore();
    const snap = await db.collection("disputes").get();

    const disputes = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (d) =>
          String(d.category || "") === "system" &&
          String(d.raisedById || "") === String(userId),
      )
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
      .map(serializeDispute);

    return res.json({ success: true, disputes });
  } catch (error) {
    console.error("Get raised system issues error:", error);
    return res.status(500).json({ error: "failed_to_fetch_raised_issues" });
  }
});

router.post("/system", async (req, res) => {
  try {
    const { userId, userName, userRole, title, description, priority } = req.body || {};

    if (!userId || !userRole || !title || !description) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["userId", "userRole", "title", "description"],
      });
    }

    const db = getFirestore();
    const now = new Date();

    const docRef = await db.collection("disputes").add({
      category: "system",
      type: "system",
      title: String(title),
      reason: String(title),
      description: String(description),
      priority: String(priority || "medium"),
      status: "open",
      raisedById: String(userId),
      raisedByName: String(userName || ""),
      raisedByRole: String(userRole),
      assignedToRole: "admin",
      assignedToId: "admin",
      assignedToName: "Admin",
      messages: [
        {
          senderRole: String(userRole),
          senderId: String(userId),
          senderName: String(userName || ""),
          message: String(description),
          createdAt: now,
        },
      ],
      resolution: "",
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({ success: true, disputeId: docRef.id, message: "System issue created" });
  } catch (error) {
    console.error("Create system issue error:", error);
    return res.status(500).json({ error: "failed_to_create_system_issue" });
  }
});

router.post("/:disputeId/reply", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { senderRole, senderId, senderName, message, status } = req.body || {};

    if (!disputeId || !senderRole || !senderId || !message) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: ["disputeId", "senderRole", "senderId", "message"],
      });
    }

    const db = getFirestore();
    const disputeRef = db.collection("disputes").doc(String(disputeId));
    const disputeSnap = await disputeRef.get();

    if (!disputeSnap.exists) {
      return res.status(404).json({ error: "dispute_not_found" });
    }

    const dispute = disputeSnap.data();
    const messages = Array.isArray(dispute.messages) ? dispute.messages : [];    

    if (String(dispute.category || "") === "system") {
      const isAdmin = String(senderRole || "") === "admin";
      const isRequester = String(senderId || "") === String(dispute.raisedById || "");

      if (!isAdmin && !isRequester) {
        return res.status(403).json({
          error: "forbidden_support_reply",
          message: "Only admin and the user who raised this support issue can reply",
        });
      }
    }

    messages.push({
      senderRole: String(senderRole),
      senderId: String(senderId),
      senderName: String(senderName || ""),
      message: String(message),
      createdAt: new Date(),
    });

    const nextStatus = status ? String(status) : String(dispute.status || "open");

    const updatePayload = {
      messages,
      status: nextStatus,
      updatedAt: new Date(),
      ...(String(senderRole) === "shg" || String(senderRole) === "admin"
        ? { resolution: String(message) }
        : {}),
      ...(nextStatus === "resolved" ? { resolvedAt: new Date() } : {}),
    };

    await disputeRef.update(updatePayload);

    return res.json({ success: true, message: "Reply added" });
  } catch (error) {
    console.error("Reply dispute error:", error);
    return res.status(500).json({ error: "failed_to_reply_dispute" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const {
      orderId,
      consumerId,
      consumerName,
      farmerId,
      farmerName,
      productName,
      reason,
      description,
      priority,
    } = req.body || {};

    if (!orderId || !consumerId || !farmerId || !reason || !description) {
      return res.status(400).json({
        error: "missing_required_fields",
        message:
          "Missing required fields: orderId, consumerId, farmerId, reason, description",
        required: ["orderId", "consumerId", "farmerId", "reason", "description"],
      });
    }

    const db = getFirestore();
    const orderSnap = await db.collection("orders").doc(String(orderId)).get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: "order_not_found" });
    }

    const order = orderSnap.data() || {};
    const listingId = String(order.listingId || "");
    const listingSnap = listingId ? await db.collection("listings").doc(listingId).get() : null;
    const listing = listingSnap?.exists ? listingSnap.data() : null;

    const assignedShgId = String(listing?.verifiedBy || "");
    const assignedShgName = String(listing?.verifiedByName || "");

    if (!assignedShgId) {
      return res.status(400).json({
        error: "shg_not_found_for_listing",
        message: "No SHG mapped for this verified listing",
      });
    }

    const { proofVideoUrl, proofFileName, proofFileType, proofFileSize } = await saveAttachment(req, orderId);

    const now = new Date();
    const disputeRef = await db.collection("disputes").add({
      category: "product",
      type: "product",
      orderId: String(orderId),
      listingId,
      consumerId: String(consumerId),
      consumerName: String(consumerName || ""),
      farmerId: String(farmerId),
      farmerName: String(farmerName || ""),
      productName: String(productName || order.productName || ""),
      reason: String(reason),
      description: String(description),
      priority: String(priority || "medium"),
      assignedToRole: "shg",
      assignedToId: assignedShgId,
      assignedToName: assignedShgName,
      proofVideoUrl: String(proofVideoUrl || ""),
      proofFileName: String(proofFileName || ""),
      proofFileType: String(proofFileType || ""),
      proofFileSize: Number(proofFileSize || 0),
      status: "open",
      resolution: "",
      resolvedAt: null,
      messages: [
        {
          senderRole: "consumer",
          senderId: String(consumerId),
          senderName: String(consumerName || ""),
          message: String(description),
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      disputeId: disputeRef.id,
      message: "Dispute created and assigned to SHG",
    });
  } catch (error) {
    console.error("Create product dispute error:", error);
    return res.status(500).json({
      error: "failed_to_create_dispute",
      message: "Failed to create dispute",
      details: error.message,
    });
  }
});

export default router;
