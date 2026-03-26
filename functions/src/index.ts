import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

const DEFAULT_CLINIC_ID = "Clinic-1";
const ADMIN_EMAIL_ALLOWLIST = new Set(["ed.felipe.gn@gmail.com"]);

function setCorsHeaders(res: functions.Response, origin: string) {
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function verifyAdmin(req: functions.https.Request) {
  const authHeader = req.get("Authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    throw new functions.https.HttpsError("unauthenticated", "Missing auth token.");
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const adminDoc = await db.collection("roles_admin").doc(decoded.uid).get();
  const isEmailAdmin = decoded.email ? ADMIN_EMAIL_ALLOWLIST.has(decoded.email) : false;

  if (!adminDoc.exists && !isEmailAdmin) {
    throw new functions.https.HttpsError("permission-denied", "Not an admin.");
  }

  return decoded;
}

function parseJsonBody<T>(req: functions.https.Request): T {
  if (typeof req.body === "object") {
    return req.body as T;
  }
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as T;
  }
  return {} as T;
}

export const createDoctorInvite = functions.https.onRequest(async (req, res) => {
  const origin = req.get("Origin") || "*";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const adminUser = await verifyAdmin(req);
    const {
      email,
      displayName,
      specialty,
      clinicId,
      canViewAllBookings,
      avatarUrl,
    } = parseJsonBody<{
      email: string;
      displayName: string;
      specialty: string;
      clinicId?: string;
      canViewAllBookings?: boolean;
      avatarUrl?: string;
    }>(req);

    if (!email || !displayName || !specialty) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    const effectiveClinicId = clinicId || DEFAULT_CLINIC_ID;

    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      userRecord = await admin.auth().createUser({ email, displayName });
    }

    const doctorRef = db.collection("doctors").doc(userRecord.uid);
    await doctorRef.set(
      {
        uid: userRecord.uid,
        email,
        displayName,
        specialty,
        clinicId: effectiveClinicId,
        avatarUrl:
          avatarUrl || `https://picsum.photos/seed/${userRecord.uid}/200/200`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminUser.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const roleRef = db.collection("roles_doctor").doc(userRecord.uid);
    await roleRef.set(
      {
        clinicId: effectiveClinicId,
        canViewAllBookings: !!canViewAllBookings,
        doctorId: doctorRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({
      success: true,
      uid: userRecord.uid,
      doctorId: doctorRef.id,
      email,
      clinicId: effectiveClinicId,
    });
  } catch (error) {
    console.error("createDoctorInvite error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});

export const createBooking = functions.https.onRequest(async (req, res) => {
  const origin = req.get("Origin") || "*";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const authHeader = req.get("Authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      throw new functions.https.HttpsError("unauthenticated", "Missing auth token.");
    }
    const decoded = await admin.auth().verifyIdToken(match[1]);

    const {
      clinicId,
      roomId,
      doctorId,
      dateKey,
      startMin,
      endMin,
      startAt,
      endAt,
    } = parseJsonBody<{
      clinicId?: string;
      roomId: string;
      doctorId: string;
      dateKey: string;
      startMin: number;
      endMin: number;
      startAt: number;
      endAt: number;
    }>(req);

    if (!roomId || !doctorId || !dateKey || startMin == null || endMin == null) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    const effectiveClinicId = clinicId || DEFAULT_CLINIC_ID;

    const adminDoc = await db.collection("roles_admin").doc(decoded.uid).get();
    const isEmailAdmin = decoded.email ? ADMIN_EMAIL_ALLOWLIST.has(decoded.email) : false;
    const isAdmin = adminDoc.exists || isEmailAdmin;

    let isDoctor = false;
    let doctorRoleDoc: admin.firestore.DocumentSnapshot | null = null;
    if (!isAdmin) {
      doctorRoleDoc = await db.collection("roles_doctor").doc(decoded.uid).get();
      isDoctor = doctorRoleDoc.exists;
    }

    if (!isAdmin && !isDoctor) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized.");
    }

    if (isDoctor && doctorRoleDoc) {
      const roleData = doctorRoleDoc.data() as { doctorId?: string; clinicId?: string } | undefined;
      if (!roleData?.doctorId || roleData.doctorId !== doctorId) {
        throw new functions.https.HttpsError("permission-denied", "Doctor mismatch.");
      }
      if (roleData.clinicId && roleData.clinicId !== effectiveClinicId) {
        throw new functions.https.HttpsError("permission-denied", "Clinic mismatch.");
      }
    }

    const bookingsSnap = await db
      .collection("bookings")
      .where("clinicId", "==", effectiveClinicId)
      .where("dateKey", "==", dateKey)
      .get();

    let existing = bookingsSnap.docs.map(d => d.data());

    if (effectiveClinicId === DEFAULT_CLINIC_ID) {
      const legacySnap = await db
        .collection("bookings")
        .where("clinicId", "==", null)
        .where("dateKey", "==", dateKey)
        .get();
      existing = existing.concat(legacySnap.docs.map(d => d.data()));
    }
    const hasRoomConflict = existing.some(
      b =>
        b.roomId === roomId &&
        b.status !== "cancelled" &&
        startMin < b.endMin &&
        endMin > b.startMin
    );
    const hasDoctorConflict = existing.some(
      b =>
        b.doctorId === doctorId &&
        b.status !== "cancelled" &&
        startMin < b.endMin &&
        endMin > b.startMin
    );

    if (hasRoomConflict || hasDoctorConflict) {
      res.status(409).json({
        success: false,
        message: hasDoctorConflict
          ? "El médico ya tiene una reserva en otro consultorio a esta misma hora."
          : "El consultorio ya está ocupado en este horario.",
      });
      return;
    }

    const bookingRef = db.collection("bookings").doc();
    await bookingRef.set({
      clinicId: effectiveClinicId,
      roomId,
      doctorId,
      dateKey,
      startMin,
      endMin,
      startAt: startAt ? admin.firestore.Timestamp.fromMillis(startAt) : null,
      endAt: endAt ? admin.firestore.Timestamp.fromMillis(endAt) : null,
      status: "confirmed",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: decoded.uid,
    });

    res.json({ success: true, bookingId: bookingRef.id });
  } catch (error) {
    console.error("createBooking error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});

export const updateBookingStatus = functions.https.onRequest(async (req, res) => {
  const origin = req.get("Origin") || "*";
  setCorsHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const authHeader = req.get("Authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      throw new functions.https.HttpsError("unauthenticated", "Missing auth token.");
    }
    const decoded = await admin.auth().verifyIdToken(match[1]);

    const { bookingId, status } = parseJsonBody<{ bookingId: string; status: string }>(req);
    if (!bookingId || !status) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Booking not found.");
    }

    const bookingData = bookingSnap.data() as { doctorId?: string } | undefined;

    const adminDoc = await db.collection("roles_admin").doc(decoded.uid).get();
    const isEmailAdmin = decoded.email ? ADMIN_EMAIL_ALLOWLIST.has(decoded.email) : false;
    const isAdmin = adminDoc.exists || isEmailAdmin;

    let isDoctorOwner = false;
    if (!isAdmin && bookingData?.doctorId) {
      const doctorRoleDoc = await db.collection("roles_doctor").doc(decoded.uid).get();
      const roleData = doctorRoleDoc.data() as { doctorId?: string } | undefined;
      isDoctorOwner = doctorRoleDoc.exists && roleData?.doctorId === bookingData.doctorId;
    }

    if (!isAdmin && !isDoctorOwner) {
      throw new functions.https.HttpsError("permission-denied", "Not authorized.");
    }

    await bookingRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: decoded.uid,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, message });
  }
});
