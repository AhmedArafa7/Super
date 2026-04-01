import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function listUsers() {
  console.log("Fetching all users from Firestore...");
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`Found ${users.length} users:`);
  users.forEach((u: any) => {
    console.log(`- ID: ${u.id} | Name: ${u.name} | Username: ${u.username} | Role: ${u.role}`);
  });

  const target = users.find((u: any) => 
    (u.name && u.name.toLowerCase().includes('mo')) || 
    (u.username && u.username.toLowerCase().includes('mo')) ||
    (u.name && u.name.includes('محمد'))
  );

  if (target) {
    console.log("\nPotential match found for 'Eng mo':");
    console.log(`ID: ${(target as any).id}, Name: ${(target as any).name}, Role: ${(target as any).role}`);
  }
}

listUsers().catch(console.error);
