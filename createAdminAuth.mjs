import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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

// Données du nouvel admin
const adminEmail = "solqueflo.balley@gmail.com";
const adminPassword = "12345678"; // À changer après la première connexion !

async function createAdminUser() {
  try {
    console.log('👤 Création du compte Firebase Auth...');
    console.log('Email:', adminEmail);
    
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;
    
    console.log('✅ Utilisateur Firebase Auth créé avec succès !');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
    console.log('\n📝 Identifiants de connexion:');
    console.log('Email:', adminEmail);
    console.log('Mot de passe:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
    
    await signOut(auth);
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.error('❌ Erreur: Cet email est déjà utilisé');
    } else if (error.code === 'auth/weak-password') {
      console.error('❌ Erreur: Le mot de passe est trop faible');
    } else {
      console.error('❌ Erreur lors de la création:', error.message);
    }
    process.exit(1);
  }
}

createAdminUser();
