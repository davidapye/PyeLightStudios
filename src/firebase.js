// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBz4J3NU-BGQqw1jHLtFvrsQzz2ybhikdU",
  authDomain: "pye-light-client-gallery.firebaseapp.com",
  projectId: "pye-light-client-gallery",
  storageBucket: "pye-light-client-gallery.firebasestorage.app",
  messagingSenderId: "861729992662",
  appId: "1:861729992662:web:f673b825b9a24d44b8fe77",
  measurementId: "G-YEZTPF2YSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);