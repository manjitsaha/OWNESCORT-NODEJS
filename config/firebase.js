const admin = require('firebase-admin');
const path = require('path');

// console.log(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "ABHI")

const serviceAccount = require(path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin SDK initialized.');

module.exports = admin;