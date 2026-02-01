// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Opcional (recomendado): offline do Firestore
import { enableIndexedDbPersistence } from "firebase/firestore";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAh0hUy7j8MXGx01krdtfvQYiq1ZlS8AQI",
  authDomain: "organiza-pelada.firebaseapp.com",
  projectId: "organiza-pelada",
  storageBucket: "organiza-pelada.firebasestorage.app",
  messagingSenderId: "311962285117",
  appId: "1:311962285117:web:41cf7b7d306a8d4cf82654",
  measurementId: "G-Z738MKX6SD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

// ✅ Offline persistence (funciona muito bem pra “offline-first”)
enableIndexedDbPersistence(db).catch(() => {
  // Pode falhar se abrir em múltiplas abas, ou browser não suporta.
});

// (Opcional, mas recomendado para produção): App Check
// 1) Ative App Check no Firebase Console e pegue a Site Key do reCAPTCHA v3
// 2) Coloque em VITE_FIREBASE_RECAPTCHA_V3_KEY
const appCheckKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_V3_KEY as string | undefined;

if (appCheckKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}
