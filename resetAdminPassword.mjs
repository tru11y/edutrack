import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword, signOut } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBx9UhZzU6QfO8bNMPM_jRyGjIyAUFW0bs",
  authDomain: "edutrak-7a344.firebaseapp.com",
  projectId: "edutrak-7a344",
  storageBucket: "edutrak-7a344.firebasestorage.app",
  messagingSenderId: "494019707155",
  appId: "1:494019707155:web:f9f687059bb45739a25ae6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const adminEmail = "admin@edutrack.com";
const newPassword = "123456";

async function updateAdminPassword() {
  try {
    console.log('🔄 Tentative de mise à jour du mot de passe...');
    console.log('Email:', adminEmail);
    
    // Essayer de se connecter avec un ancien mot de passe (pour voir si on peut)
    // Pour l'instant, on va juste vérifier via Firebase Admin SDK via CLI
    console.log('\n⚠️ Pour réinitialiser le mot de passe, utilisez la Firebase Console:');
    console.log('1. Allez à https://console.firebase.google.com');
    console.log('2. Projet: edutrak-7a344');
    console.log('3. Authentication → Users');
    console.log('4. Cliquez sur admin@edutrack.com');
    console.log('5. Cliquez les 3 points → Reset password');
    console.log('\nOu connectez-vous directement avec le mot de passe existant.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
