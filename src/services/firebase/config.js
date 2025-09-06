import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase project configuration
  apiKey: "AIzaSyCCHAb8fAflXjVQfPvktsWjR8FsDLJYOM0",
  authDomain: "patel-enterprise-pvt-ltd.firebaseapp.com",
  databaseURL: "https://patel-enterprise-pvt-ltd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "patel-enterprise-pvt-ltd",
  storageBucket: "patel-enterprise-pvt-ltd.firebasestorage.app",
  messagingSenderId: "866453015291",
  appId: "1:866453015291:web:99383c0f8b1351ce9b7e5e",
  measurementId: "G-C02RRKYM38"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Realtime Database
export const database = getDatabase(app);

// Connect to emulators in development (optional)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectDatabaseEmulator(database, 'localhost', 9000);
  } catch (error) {
    console.log('Emulator connection error:', error);
  }
}

export default app;