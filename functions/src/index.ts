import * as functions from 'firebase-functions';
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
//         (Functions Admin SDK bypasses rules)
// FIX 4: Server controls folder, client sends galleryId only
// FIX 5: File type + size enforced via signed params
// FIX 14: Upload restrictions enforced server-side
// FIX 15: Structured logging added
// -----------------------------------------------
export const generateCloudinarySignature = functions
  .region('asia-south1')
  .https.onCall(async (data, context) => {

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
      if (err.code) throw err;
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
      if (err.code) throw err;
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

    const apiSecret =
      cloudinaryConfig.apiSecret ||
      cloudinaryConfig.encryptedSecret;

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
    // FIX 5 + 14: Sign file restrictions so client cannot override
    const timestamp = Math.round(new Date().getTime() / 1000);
    const allowedFormats = 'jpg,jpeg,png,webp,gif';
    const maxFileSize = 20971520; // 20MB

    // Parameters MUST be alphabetically sorted for Cloudinary
    const params: Record<string, string> = {
      allowed_formats: allowedFormats,
      folder: uploadFolder,
      max_file_size: maxFileSize.toString(),
      timestamp: timestamp.toString()
    };

    const paramsString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // FIX 1: SHA1 - Cloudinary REQUIRES SHA1
    const signature = crypto
      .createHash('sha1')
      .update(paramsString + apiSecret)
      .digest('hex');

    logInfo(FN, 'Signature generated successfully', { uid, uploadFolder });

    return {
      signature,
      timestamp,
      apiKey: cloudinaryConfig.apiKey,
      cloudName: cloudinaryConfig.cloudName,
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
  .https.onCall(async (data, context) => {

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
// Angular CANNOT read this path
// -----------------------------------------------
export const saveCloudinaryConfig = functions
  .region('asia-south1')
  .https.onCall(async (data, context) => {

    const FN = 'saveCloudinaryConfig';

    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in.'
      );
    }

    const uid = context.auth.uid;
    const { cloudName, apiKey, apiSecret } = data;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'cloudName, apiKey and apiSecret are required.'
      );
    }

    logInfo(FN, 'Saving cloudinary config', { uid, cloudName });

    // Save to private subcollection (not readable by Angular)
    await db
      .collection('photographers')
      .doc(uid)
      .collection('private')
      .doc('cloudinary_config')
      .set({
        cloudName,
        apiKey,
        apiSecret,       // stored in private subcollection
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    // Save non-secret fields to public profile
    await db
      .collection('photographers')
      .doc(uid)
      .update({
        'cloudinary.cloudName': cloudName,
        'cloudinary.apiKey': apiKey,
        'cloudinary.configured': true
      });

    logInfo(FN, 'Cloudinary config saved', { uid });
    return { success: true };
  });



