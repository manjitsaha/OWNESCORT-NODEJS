// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
// const { getAnalytics } = require("firebase/analytics"); // Analytics only works in browser environments

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAp2HizLEIaGWawIabT8lMkfVFYr6-tSyU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "hoor-d06d5.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "hoor-d06d5",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "hoor-d06d5.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "803642413198",
  appId: process.env.FIREBASE_APP_ID || "1:803642413198:web:2f7bb9fc11a96ce41fb9df",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-JCT4MRJR2H"
};

// Initialize Firebase
const firebaseClientApp = initializeApp(firebaseConfig);
// const analytics = getAnalytics(firebaseClientApp);

module.exports = firebaseClientApp;
