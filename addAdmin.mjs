import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: "AIzaSyBx9UhZzU6QfO8bNMPM_jRyGjIyAUFW0bs",
  authDomain: "edutrak-7a344.firebaseapp.com",
  projectId: "edutrak-7a344",
  storageBucket: "edutrak-7a344.firebasestorage.app",
  messagingSenderId: "494019707155",
  appId: "1:494019707155:web:f9f687059bb45739a25ae6",
};

console.log('🔧 Configuration Firebase:');
console.log('Project ID:', firebaseConfig.projectId);

// Initialiser l'app Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Données du nouvel admin
const userData = {
  role: "admin",
  email: "admin@edutrack.com",
  isBanned: false,
  createdAt: new Date().toISOString(),
};

// UID de l'admin (vous pouvez le changer)
const userUid = "admin_001";

// Fonction pour ajouter l'admin
async function addAdminToFirestore() {
  try {
    console.log('📝 Ajout de l\'administrateur...');
    console.log('UID:', userUid);
    console.log('Email:', userData.email);
    
    await setDoc(doc(db, "users", userUid), userData);
    
    console.log('✅ Document ajouté avec succès à la collection "users"');
    console.log('UID du document:', userUid);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du document:', error.message);
    process.exit(1);
  }
}

// Exécuter la fonction
addAdminToFirestore();
