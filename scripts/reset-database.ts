import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();

const collectionsToDelete = [
  "users",
  "providers",
  "providerApplications",
  "addresses",
  "contactForms",
  "printers",
  "orders",
];

async function deleteCollection(collectionName: string) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`✓ ${collectionName}: Koleksiyon zaten boş`);
    return 0;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  await batch.commit();
  console.log(`✓ ${collectionName}: ${count} döküman silindi`);
  return count;
}

async function resetDatabase() {
  console.log("\n🗑️  Firestore Veritabanı Sıfırlanıyor...\n");

  let totalDeleted = 0;

  for (const collection of collectionsToDelete) {
    try {
      const deleted = await deleteCollection(collection);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`✗ ${collection}: Hata - ${error}`);
    }
  }

  console.log(`\n✅ Toplam ${totalDeleted} döküman silindi.`);
  console.log("🎉 Veritabanı başarıyla sıfırlandı!\n");
}

resetDatabase();

