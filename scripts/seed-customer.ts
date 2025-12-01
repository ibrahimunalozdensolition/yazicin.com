import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "yazicim-2e5b4.firebaseapp.com",
  projectId: "yazicim-2e5b4",
  storageBucket: "yazicim-2e5b4.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });

async function seedCustomer() {
  console.log("🚀 Test müşteri oluşturuluyor...\n");

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "customer@test.com",
      "test123456"
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: "Test Müşteri" });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: "customer@test.com",
      displayName: "Test Müşteri",
      role: "customer",
      isEmailVerified: true,
      verifiedByAdmin: false,
      phoneNumber: "0 (532) 123 45 67",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, "addresses"), {
      userId: user.uid,
      title: "Ev",
      city: "İstanbul",
      district: "Kadıköy",
      fullAddress: "Caferağa Mah. Moda Cad. No:10 D:5",
      zipCode: "34710",
      isDefault: true,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "addresses"), {
      userId: user.uid,
      title: "İş",
      city: "İstanbul",
      district: "Şişli",
      fullAddress: "Mecidiyeköy Mah. Büyükdere Cad. No:100",
      zipCode: "34387",
      isDefault: false,
      createdAt: serverTimestamp(),
    });

    console.log("✅ Test müşteri oluşturuldu!");
    console.log("\n📋 Giriş Bilgileri:");
    console.log("─".repeat(40));
    console.log("📧 E-posta: customer@test.com");
    console.log("🔑 Şifre: test123456");
    console.log("📍 2 adres eklendi (Ev + İş)");

  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      console.log("⚠️  customer@test.com zaten mevcut!");
      console.log("\n📋 Giriş Bilgileri:");
      console.log("─".repeat(40));
      console.log("📧 E-posta: customer@test.com");
      console.log("🔑 Şifre: test123456");
    } else {
      console.error(`❌ Hata: ${error.message}`);
    }
  }

  process.exit(0);
}

seedCustomer();

