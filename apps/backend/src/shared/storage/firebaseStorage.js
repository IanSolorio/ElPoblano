import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { env } from "../../config/env.js";

if (!env.firebaseStorageBucket) throw new Error("FIREBASE_STORAGE_BUCKET no está configurado.");

const hasEnvironmentCredentials = Boolean(
  env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
);

const credential = hasEnvironmentCredentials
  ? cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    })
  : applicationDefault();

const firebaseApp = getApps()[0] ?? initializeApp({
  credential,
  storageBucket: env.firebaseStorageBucket,
});

export const firebaseBucket = getStorage(firebaseApp).bucket();
