import express from "express";
import { getFirestore } from "../config/firebase.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      address,
      district,
      state,
      pincode,
      email,
      password,
    } = req.body || {};

    if (
      !name ||
      !phone ||
      !role ||
      !address ||
      !district ||
      !state ||
      !pincode ||
      !password
    ) {
      return res.status(400).json({
        error: "missing_required_fields",
        required: [
          "name",
          "phone",
          "role",
          "address",
          "district",
          "state",
          "pincode",
          "password",
        ],
      });
    }

    if (!["farmer", "consumer"].includes(String(role))) {
      return res.status(400).json({
        error: "invalid_role",
        message: "Role must be farmer or consumer",
      });
    }

    const db = getFirestore();

    const phoneSnap = await db
      .collection("users")
      .where("phone", "==", String(phone).trim())
      .limit(1)
      .get();

    if (!phoneSnap.empty) {
      return res.status(409).json({
        error: "phone_exists",
        message: "An account with this phone number already exists",
      });
    }

    const normalizedEmail = String(email || "").trim();
    if (normalizedEmail) {
      const emailSnap = await db
        .collection("users")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();

      if (!emailSnap.empty) {
        return res.status(409).json({
          error: "email_exists",
          message: "An account with this email already exists",
        });
      }
    }

    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      role: String(role),
      address: String(address).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      email: normalizedEmail,
      password: String(password),
      verified: false,
      createdAt: new Date(),
    };

    const ref = await db.collection("users").add(payload);

    return res.status(201).json({
      success: true,
      user: {
        id: ref.id,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      error: "register_failed",
      message: "Failed to register user",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["emailOrPhone", "password"],
      });
    }

    const isEmail = String(emailOrPhone).includes("@");
    const field = isEmail ? "email" : "phone";

    const db = getFirestore();
    const usersSnap = await db
      .collection("users")
      .where(field, "==", String(emailOrPhone).trim())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: `No account found with this ${isEmail ? "email" : "phone number"}`,
      });
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Incorrect password",
      });
    }

    return res.json({
      success: true,
      user: {
        id: userDoc.id,
        name: userData.name || "",
        phone: userData.phone || "",
        email: userData.email || "",
        role: userData.role || "farmer",
        district: userData.district || "",
        state: userData.state || "",
        taluk: userData.taluk || "",
        assignedTaluks: userData.assignedTaluks || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "login_failed",
      message: "Failed to login",
    });
  }
});

export default router;
