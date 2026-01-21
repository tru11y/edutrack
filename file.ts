import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// 1. Initialisez votre application Firebase (si ce n'est pas déjà fait)
// Remplacez 'your-config-object' par la configuration de votre projet Firebase
const firebaseConfig = {
  // Votre configuration Firebase ici (apiKey, authDomain, projectId, etc.)
  // Vous pouvez trouver cela dans les paramètres de votre projet Firebase dans la console.
};

const app = initializeApp(firebaseConfig);

// 2. Obtenez une référence à votre instance Firestore
const db = getFirestore(app);

// 3. Définissez les données du document que vous souhaitez ajouter
const userData = {
  role: "admin",
  email: "admin@edutrack.com",
  isBanned: false
};

// 4. Définissez l'UID que vous souhaitez utiliser comme ID du document
// Dans votre cas, c'est "UID_FIREBASE". C'est une bonne pratique d'utiliser l'UID de l'utilisateur
// comme ID de document dans la collection 'users'.
const userUid = "EbBAThrph0VVoceErOg0POCBp0y1";

// 5. Ajoutez le document à la collection 'users' avec l'UID spécifié
async function addUserToFirestore() {
  try {
    // La fonction `doc()` crée une référence à un document spécifique
    // La fonction `setDoc()` crée ou écrase un document
    await setDoc(doc(db, "users", userUid), userData);
    console.log("Document ajouté avec succès à la collection 'users' avec l'UID:", userUid);
  } catch (e) {
    console.error("Erreur lors de l'ajout du document: ", e);
  }
}

// Appelez la fonction pour exécuter l'opération
addUserToFirestore();
