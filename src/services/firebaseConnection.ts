// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCc3j5YW_VWYO8p9wNW0q7gxDCCWqtiAQI",
  authDomain: "tarefasplus-a106a.firebaseapp.com",
  projectId: "tarefasplus-a106a",
  storageBucket: "tarefasplus-a106a.appspot.com",
  messagingSenderId: "879633649794",
  appId: "1:879633649794:web:f35e9f8ef2f91628a8a49b"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp)

export { db };