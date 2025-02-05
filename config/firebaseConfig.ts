import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuIwlMaf9cr7ELRX0J6fM3hPeJLwU7miM",
  authDomain: "dsnalphaver.firebaseapp.com",
  projectId: "dsnalphaver",
  storageBucket: "dsnalphaver.firebasestorage.app",
  messagingSenderId: "472252711221",
  appId: "1:472252711221:web:fc1ad1bc7f46ea9a428c7c",
  measurementId: "G-MC7RZ1MT97",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
