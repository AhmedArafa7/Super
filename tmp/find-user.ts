import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-3522991053-84d29",
  "appId": "1:663102763152:web:483fb4c5e300dd53316815",
  "apiKey": "AIzaSyAdHKCp9X3rCTdyyZ0XeiRvxWOp2qVaQws",
  "authDomain": "studio-3522991053-84d29.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "663102763152",
  "storageBucket": "studio-3522991053-84d29.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findUser() {
  console.log("Searching for user 'Eng mo'...");
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const matchingUsers = users.filter((u: any) => 
    (u.name && u.name.toLowerCase().includes('eng mo')) || 
    (u.username && u.username.toLowerCase().includes('eng mo'))
  );

  if (matchingUsers.length === 0) {
    console.log("No users found matching 'Eng mo'.");
    console.log("All users in DB:", users.map((u: any) => `${u.name} (@${u.username})`));
  } else {
    console.log("Found matching users:");
    matchingUsers.forEach((u: any) => {
      console.log(`- ID: ${u.id}, Name: ${u.name}, Username: ${u.username}, Current Role: ${u.role}`);
    });
  }
}

findUser().catch(console.error);
