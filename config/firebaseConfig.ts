import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { API_KEY_FIRE_BASE } from "@env";
import { authDomain } from "@env";
import { projectId } from "@env";
import { storageBucket } from "@env";
import { messagingSenderId } from "@env";
import { measurementId } from "@env";
import { appId } from "@env";


const firebaseConfig = {
  apiKey: API_KEY_FIRE_BASE,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
