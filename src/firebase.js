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
  apiKey: "AIzaSyCLlsaTub56NYm1aAzSrUioj1QeFJJ3v8U",
  authDomain: "pyelightgallery.firebaseapp.com",
  projectId: "pyelightgallery",
  storageBucket: "pyelightgallery.firebasestorage.app",
  messagingSenderId: "349810570651",
  appId: "1:349810570651:web:d2b0b929f5488841d99d3e",
  measurementId: "G-WPTRWZXY5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);