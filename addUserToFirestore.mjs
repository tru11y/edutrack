import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Données du nouvel admin
const userUid = "qo2v4eJqCRO1OG4GXFHXUnEvtvI2";
const userData = {
  role: "admin",
  email: "solqueflo.balley@gmail.com",
  isBanned: false,
  isActive: true,
  createdAt: new Date().toISOString(),
};

async function addUserToFirestore() {
  try {
    console.log('📝 Ajout de l\'utilisateur à Firestore...');
    console.log('UID:', userUid);
    console.log('Email:', userData.email);
    
    await setDoc(doc(db, "users", userUid), userData);
    
    console.log('✅ Document ajouté avec succès à la collection "users"');
    console.log('\n🎉 L\'utilisateur est maintenant admin !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du document:', error.message);
    process.exit(1);
  }
}

addUserToFirestore();
