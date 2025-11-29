// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsAFKCQBh7TegmExnIg-mP57OXTkwfR-w",
  authDomain: "yazicim-2e5b4.firebaseapp.com",
  databaseURL: "https://yazicim-2e5b4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yazicim-2e5b4",
  storageBucket: "yazicim-2e5b4.firebasestorage.app",
  messagingSenderId: "718069838642",
  appId: "1:718069838642:web:e7ccf065b28305400a5d2b",
  measurementId: "G-WC5KN9HXB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);