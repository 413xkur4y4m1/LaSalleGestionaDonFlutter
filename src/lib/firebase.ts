// Importar las funciones necesarias del SDK modular de Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// Opcional: Importar Auth si lo usas (next-auth a menudo lo maneja, pero si necesitas el auth de cliente...)
// import { getAuth } from 'firebase/auth'; 

// Tu objeto de configuración de Firebase (obtenido de la consola de Firebase)
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI", // <-- REEMPLAZA ESTO
  authDomain: "TU_AUTH_DOMAIN_AQUI", // <-- REEMPLAZA ESTO
  projectId: "TU_PROJECT_ID_AQUI", // <-- REEMPLAZA ESTO
  storageBucket: "TU_STORAGE_BUCKET_AQUI", // <-- REEMPLAZA ESTO
  messagingSenderId: "TU_MESSAGING_SENDER_ID_AQUI", // <-- REEMPLAZA ESTO
  appId: "TU_APP_ID_AQUI" // <-- REEMPLAZA ESTO
};

// Inicializa Firebase solo si no ha sido inicializado ya (importante para Next.js SSR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa los servicios específicos que estás usando (Firestore, Auth, Storage, etc.)
const db = getFirestore(app);
// const auth = getAuth(app); // Descomentar si es necesario

// Exporta los servicios inicializados para usarlos en otros archivos (como firestore-operations.ts)
export { app, db }; 
