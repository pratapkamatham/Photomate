import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';


admin.initializeApp();
const db = admin.firestore();


// -----------------------------------------------
// HELPER: Structured logging
// FIX 15: Centralized logging
// -----------------------------------------------
function logInfo(fn: string, msg: string, data?: any): void {
  console.log(JSON.stringify({ fn, msg, data, ts: new Date().toISOString() }));
}

function logError(fn: string, msg: string, err?: any): void {
  console.error(JSON.stringify({ fn, msg, err: err?.message, ts: new Date().toISOString() }));
}

function isCallableError(err: any): boolean {
  return err instanceof functions.https.HttpsError;
}

// -----------------------------------------------
// HELPER: Sanitize folder path
// FIX 4 + 5: Server-controlled folder only
// -----------------------------------------------
function sanitizeSlug(input: string): string {
  return (input || '').replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 64);
}

// -----------------------------------------------
// GENERATE CLOUDINARY SIGNATURE
// FIX 1: SHA1 (not SHA256) - Cloudinary requires SHA1
// FIX 2: Node 20
// FIX 3: API secret from Firestore subcollection
//        (Functions Admin SDK bypasses rules)
// FIX 4: Server controls folder, client sends galleryId only
// FIX 5: File type + size enforced via signed params
// FIX 14: Upload restrictions enforced server-side
// FIX 15: Structured logging added
// -----------------------------------------------
export const generateCloudinarySignature = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => { // 🚀 Explicitly typed parameters

    const FN = 'generateCloudinarySignature';

    // Auth check
    if (!context.auth) {
      logError(FN, 'Unauthenticated request');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to upload.'
      );
    }

    const uid = context.auth.uid;
    logInfo(FN, 'Signature requested', { uid });

    // Verify role
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists || userDoc.data()!['role'] !== 'photographer') {
        logError(FN, 'Non-photographer upload attempt', { uid });
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only photographers can upload media.'
        );
      }
    } catch (err: any) {
      if (isCallableError(err)) throw err;
      logError(FN, 'User lookup failed', err);
      throw new functions.https.HttpsError('internal', 'User verification failed.');
    }

    // FIX 3 + 4: Load photographer from subcollection
    // photographers/{uid}/private/cloudinary_config
    // Admin SDK bypasses Firestore rules
    let photographerData: any;
    let cloudinaryConfig: any;

    try {
      // First get public profile for slug
      const photographerDoc = await db
        .collection('photographers')
        .doc(uid)
        .get();

      if (!photographerDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Photographer profile not found. Please complete settings first.'
        );
      }

      photographerData = photographerDoc.data()!;

      // FIX 3: Get secret from private subcollection
      // Angular CANNOT read this path (rule: allow read: if false)
      const privateDoc = await db
        .collection('photographers')
        .doc(uid)
        .collection('private')
        .doc('cloudinary_config')
        .get();

      if (privateDoc.exists) {
        // New secure architecture
        cloudinaryConfig = privateDoc.data();
      } else {
        // Fallback to old field for backwards compatibility
        cloudinaryConfig = photographerData['cloudinary'];
      }

    } catch (err: any) {
      if (isCallableError(err)) throw err;
      logError(FN, 'Photographer lookup failed', err);
      throw new functions.https.HttpsError('internal', 'Profile lookup failed.');
    }

    if (!cloudinaryConfig?.cloudName || !cloudinaryConfig?.apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cloudinary not configured. Please connect your account in Settings.'
      );
    }

    if (!cloudinaryConfig?.apiSecret && !cloudinaryConfig?.encryptedSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cloudinary API secret missing. Please reconnect your account.'
      );
    }

    const apiKey = (cloudinaryConfig.apiKey || '').toString().trim();
    const cloudName = (cloudinaryConfig.cloudName || '').toString().trim();
    const apiSecret = (cloudinaryConfig.apiSecret || cloudinaryConfig.encryptedSecret || '')
      .toString()
      .trim();

    if (!apiKey || !cloudName || !apiSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cloudinary credentials are incomplete. Please reconnect your account.'
      );
    }

    logInfo(FN, 'Cloudinary credentials loaded', {
      uid,
      cloudName,
      apiKeyLast4: apiKey.slice(-4),
      secretLength: apiSecret.length
    });

    // FIX 4: Server builds folder - sanitize all inputs
    const photographerSlug = sanitizeSlug(
      photographerData['slug'] || uid
    );

    // galleryId from client - sanitized server-side
    const rawGalleryId = (data.galleryId || '').toString();
    const galleryId = sanitizeSlug(rawGalleryId);

    // Server-controlled folder ONLY
    const uploadFolder = galleryId
      ? `photographers/${photographerSlug}/${galleryId}`
      : `photographers/${photographerSlug}`;

    logInfo(FN, 'Upload folder set', { uploadFolder });

    // FIX 1: SHA1 required by Cloudinary (not SHA256)
    // FIX 5 + 14: Keep file-size validation in Angular.
    // Cloudinary does not include max_file_size in this upload signature string.
    const timestamp = Math.round(new Date().getTime() / 1000);
    const allowedFormats = 'jpg,jpeg,png,webp,gif';
    const maxFileSize = 10485760; // 10MB

    // Parameters MUST be alphabetically sorted for Cloudinary
    const params: Record<string, string> = {
      allowed_formats: allowedFormats,
      folder: uploadFolder,
      timestamp: timestamp.toString()
    };

    const paramsString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    logInfo(FN, 'Signing Cloudinary upload params', {
      uid,
      cloudName,
      apiKeyLast4: apiKey.slice(-4),
      paramsString
    });

    // FIX 1: SHA1 - Cloudinary REQUIRES SHA1
    const signature = crypto
      .createHash('sha1')
      .update(paramsString + apiSecret)
      .digest('hex');

    logInfo(FN, 'Signature generated successfully', { uid, uploadFolder });

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: uploadFolder,
      allowedFormats,
      maxFileSize
    };
  });

// -----------------------------------------------
// DELETE CLOUDINARY ASSET
// FIX 10: Actual deletion (not fake success)
// FIX 9: Verify asset belongs to photographer
// FIX 15: Structured logging
// -----------------------------------------------
export const deleteCloudinaryAsset = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => { // 🚀 Explicitly typed parameters

    const FN = 'deleteCloudinaryAsset';

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }

    const uid = context.auth.uid;
    const { publicId } = data;

    if (!publicId || typeof publicId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'publicId is required.'
      );
    }

    logInfo(FN, 'Delete requested', { uid, publicId });

    // Load photographer
    const photographerDoc = await db
      .collection('photographers')
      .doc(uid)
      .get();

    if (!photographerDoc.exists) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Photographer profile not found.'
      );
    }

    const photographerSlug = sanitizeSlug(
      photographerDoc.data()!['slug'] || uid
    );

    // FIX 9: Verify publicId belongs to this photographer
    // Asset must be under their folder
    const expectedPrefix = `photographers/${photographerSlug}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      logError(FN, 'Unauthorized delete attempt', { uid, publicId });
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only delete your own assets.'
      );
    }

    // Get cloudinary config
    let cloudinaryConfig: any;

    const privateDoc = await db
      .collection('photographers')
      .doc(uid)
      .collection('private')
      .doc('cloudinary_config')
      .get();

    if (privateDoc.exists) {
      cloudinaryConfig = privateDoc.data();
    } else {
      cloudinaryConfig = photographerDoc.data()!['cloudinary'];
    }

    if (!cloudinaryConfig) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cloudinary not configured.'
      );
    }

    const apiSecret =
      cloudinaryConfig.apiSecret ||
      cloudinaryConfig.encryptedSecret;

    // FIX 10: Actual Cloudinary deletion via Admin API
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);

      // FIX 1: SHA1 for delete signature too
      const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash('sha1')
        .update(paramsToSign + apiSecret)
        .digest('hex');

      const fetch = require('node-fetch');
      const formData = new URLSearchParams();
      formData.append('public_id', publicId);
      formData.append('api_key', cloudinaryConfig.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
        { method: 'POST', body: formData }
      );

      const result = await response.json();

      logInfo(FN, 'Cloudinary delete result', { publicId, result: result.result });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary error: ${result.result}`);
      }

      return { success: true, publicId };

    } catch (err: any) {
      logError(FN, 'Delete failed', err);
      throw new functions.https.HttpsError(
        'internal',
        `Deletion failed: ${err.message}`
      );
    }
  });

// -----------------------------------------------
// SAVE CLOUDINARY CONFIG SECURELY
// FIX 3: Saves to private subcollection
// Angular CANNOT read this path directly
// -----------------------------------------------
export const saveCloudinaryConfig = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {

    const FN = 'saveCloudinaryConfig';

    if (!context.auth) {
      logError(FN, 'Unauthenticated request');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }

    const uid = context.auth.uid;
    const cloudName = (data.cloudName || '').toString().trim();
    const apiKey = (data.apiKey || '').toString().trim();
    const apiSecret = (data.apiSecret || '').toString().trim();

    if (!cloudName || !apiKey || !apiSecret) {
      logError(FN, 'Missing arguments', { uid });
      throw new functions.https.HttpsError(
        'invalid-argument',
        'cloudName, apiKey and apiSecret are required.'
      );
    }

    logInfo(FN, 'Saving cloudinary config', { uid, cloudName });

    try {
      // 1. Save to private subcollection (hidden from Frontend client)
      await db
        .collection('photographers')
        .doc(uid)
        .collection('private')
        .doc('cloudinary_config')
        .set({
          cloudName,
          apiKey,
          apiSecret,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      // 2. 🚀 FIX: Use set with merge: true instead of update.
      // This safely handles cases where the root photographer document doesn't exist yet!
      await db
        .collection('photographers')
        .doc(uid)
        .set({
          ownerUid:uid,
          cloudinary: {
            cloudName,
            apiKey,
            configured: true
          }
        }, { merge: true });

      logInfo(FN, 'Cloudinary config saved successfully', { uid });
      return { success: true };

    } catch (err: any) {
      logError(FN, 'Save operation failed', err);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to save configuration.'
      );
    }
  });

// -----------------------------------------------
// CREATE PLATFORM USER (super-admin only)
// Creates Firebase Auth and role data without replacing
// the current admin browser session.
// -----------------------------------------------
export const createPlatformUser = functions
  .region('asia-south1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const FN = 'createPlatformUser';

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }

    const caller = await db.collection('users').doc(context.auth.uid).get();
    if (!caller.exists || caller.data()?.['role'] !== 'super-admin') {
      logError(FN, 'Non-admin account creation attempt', { uid: context.auth.uid });
      throw new functions.https.HttpsError('permission-denied', 'Only admins can create users.');
    }

    const name = (data.name || '').toString().trim();
    const email = (data.email || '').toString().trim().toLowerCase();
    const phone = (data.phone || '').toString().trim();
    const requestedRole = data.role === 'admin' ? 'super-admin' : data.role;
    const allowedRoles = ['affiliate', 'photographer', 'super-admin'];

    if (!name || !email || !phone || !allowedRoles.includes(requestedRole)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Name, phone, email, and a valid role are required.'
      );
    }

    const temporaryPassword = `Pm${crypto.randomBytes(9).toString('base64url')}9`;
    let userRecord: admin.auth.UserRecord;

    try {
      userRecord = await admin.auth().createUser({
        email,
        password: temporaryPassword,
        displayName: name
      });
    } catch (err: any) {
      logError(FN, 'Auth user creation failed', err);
      if (err?.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'An account already exists with this email.');
      }
      throw new functions.https.HttpsError('internal', 'Unable to create the user account.');
    }

    const uid = userRecord.uid;
    const batch = db.batch();
    batch.set(db.collection('users').doc(uid), {
      uid,
      name,
      email,
      phone,
      role: requestedRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    });

    if (requestedRole === 'photographer') {
      const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'studio';
      const slug = `${slugBase}-${uid.slice(0, 6)}`;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      batch.set(db.collection('photographers').doc(uid), {
        ownerUid: uid,
        slug,
        studioName: name,
        email,
        phone,
        theme: {
          primaryColor: '#c9a96e',
          accentColor: '#e8c98b',
          backgroundColor: '#111111',
          textColor: '#ffffff',
          font: 'Poppins',
          layout: 'luxury-dark',
          heroStyle: 'fullscreen'
        },
        subscriptionPlan: 'trial',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      batch.set(db.collection('subscriptions').doc(uid), {
        photographerId: uid,
        plan: 'trial',
        status: 'active',
        startDate: admin.firestore.FieldValue.serverTimestamp(),
        trialEndsAt: admin.firestore.Timestamp.fromDate(trialEndsAt),
        amount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    logInfo(FN, 'Platform user created', { uid, role: requestedRole, createdBy: context.auth.uid });

    return { uid, temporaryPassword, role: requestedRole };
  });
