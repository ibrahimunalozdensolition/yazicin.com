import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp, connectFirestoreEmulator } from "firebase/firestore";
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

const providers = [
  {
    email: "provider1@test.com",
    password: "test123456",
    displayName: "3D Baskı Merkezi",
    businessName: "3D Baskı Merkezi",
    businessType: "company",
    city: "İstanbul",
    district: "Kadıköy",
    address: "Caferağa Mah. Moda Cad. No:45",
    experience: "5 yıllık profesyonel 3D baskı deneyimi. FDM ve SLA teknolojilerinde uzman.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 3 V2",
        type: "FDM",
        buildVolume: { x: 220, y: 220, z: 250 },
        materials: ["PLA", "ABS", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil", "Sarı"],
        pricing: { perGram: 1.2, perHour: 15, minOrder: 50 },
      },
      {
        brand: "Anycubic",
        model: "Photon Mono X",
        type: "SLA",
        buildVolume: { x: 192, y: 120, z: 245 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Flexible"],
        colors: ["Gri", "Beyaz", "Transparan", "Siyah"],
        pricing: { perGram: 2.5, perHour: 20, minOrder: 100 },
      },
      {
        brand: "Prusa",
        model: "i3 MK3S+",
        type: "FDM",
        buildVolume: { x: 250, y: 210, z: 210 },
        materials: ["PLA", "ABS", "PETG", "ASA", "Nylon", "PC"],
        colors: ["Siyah", "Beyaz", "Gri", "Turuncu", "Mor", "Pembe"],
        pricing: { perGram: 1.5, perHour: 18, minOrder: 60 },
      },
    ],
  },
  {
    email: "provider2@test.com",
    password: "test123456",
    displayName: "MakerLab Türkiye",
    businessName: "MakerLab Türkiye",
    businessType: "company",
    city: "Ankara",
    district: "Çankaya",
    address: "Kızılay Mah. Atatürk Bulvarı No:123",
    experience: "Endüstriyel 3D baskı çözümleri. ISO sertifikalı üretim.",
    printers: [
      {
        brand: "Formlabs",
        model: "Form 3",
        type: "SLA",
        buildVolume: { x: 145, y: 145, z: 185 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Dental", "Resin - Flexible"],
        colors: ["Gri", "Beyaz", "Siyah", "Transparan"],
        pricing: { perGram: 3.0, perHour: 25, minOrder: 150 },
      },
      {
        brand: "Ultimaker",
        model: "S5",
        type: "FDM",
        buildVolume: { x: 330, y: 240, z: 300 },
        materials: ["PLA", "ABS", "PETG", "Nylon", "PC", "TPU", "PVA"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu"],
        pricing: { perGram: 2.0, perHour: 22, minOrder: 80 },
      },
      {
        brand: "Raise3D",
        model: "Pro2 Plus",
        type: "FDM",
        buildVolume: { x: 305, y: 305, z: 605 },
        materials: ["PLA", "ABS", "PETG", "ASA", "Carbon Fiber", "Wood Fill"],
        colors: ["Siyah", "Beyaz", "Kahverengi", "Gümüş", "Altın"],
        pricing: { perGram: 1.8, perHour: 20, minOrder: 100 },
      },
    ],
  },
  {
    email: "provider3@test.com",
    password: "test123456",
    displayName: "Prototip Atölyesi",
    businessName: "Prototip Atölyesi",
    businessType: "individual",
    city: "İzmir",
    district: "Bornova",
    address: "Ege Üniversitesi Kampüsü Teknokent B Blok",
    experience: "Mühendislik prototipleri ve özel parça üretimi. Hızlı teslimat.",
    printers: [
      {
        brand: "BambuLab",
        model: "X1 Carbon",
        type: "FDM",
        buildVolume: { x: 256, y: 256, z: 256 },
        materials: ["PLA", "ABS", "PETG", "TPU", "ASA", "PC", "Carbon Fiber"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil"],
        pricing: { perGram: 1.4, perHour: 16, minOrder: 40 },
      },
      {
        brand: "Elegoo",
        model: "Saturn 2",
        type: "Resin",
        buildVolume: { x: 219, y: 123, z: 250 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Flexible"],
        colors: ["Gri", "Beyaz", "Transparan", "Siyah", "Yeşil"],
        pricing: { perGram: 2.2, perHour: 18, minOrder: 70 },
      },
      {
        brand: "Creality",
        model: "CR-10 Smart Pro",
        type: "FDM",
        buildVolume: { x: 300, y: 300, z: 400 },
        materials: ["PLA", "ABS", "PETG", "Wood Fill", "Metal Fill"],
        colors: ["Siyah", "Beyaz", "Gri", "Kahverengi", "Gümüş", "Altın"],
        pricing: { perGram: 1.3, perHour: 14, minOrder: 45 },
      },
    ],
  },
  {
    email: "provider4@test.com",
    password: "test123456",
    displayName: "Dijital Fabrika",
    businessName: "Dijital Fabrika",
    businessType: "company",
    city: "Bursa",
    district: "Nilüfer",
    address: "BTSO OSB Teknoloji Geliştirme Bölgesi",
    experience: "Seri üretim ve küçük parti üretimde uzman. 7/24 hizmet.",
    printers: [
      {
        brand: "Markforged",
        model: "Mark Two",
        type: "FDM",
        buildVolume: { x: 320, y: 132, z: 154 },
        materials: ["Nylon", "Carbon Fiber", "PETG", "PLA"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 3.5, perHour: 30, minOrder: 200 },
      },
      {
        brand: "Phrozen",
        model: "Sonic Mega 8K",
        type: "DLP",
        buildVolume: { x: 330, y: 185, z: 400 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Dental"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 2.8, perHour: 22, minOrder: 120 },
      },
      {
        brand: "FlashForge",
        model: "Creator 4",
        type: "FDM",
        buildVolume: { x: 400, y: 350, z: 500 },
        materials: ["PLA", "ABS", "PETG", "ASA", "HIPS", "PVA", "Nylon"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu", "Mor"],
        pricing: { perGram: 1.6, perHour: 17, minOrder: 55 },
      },
    ],
  },
  {
    email: "provider5@test.com",
    password: "test123456",
    displayName: "Hobi 3D Print",
    businessName: "Hobi 3D Print",
    businessType: "individual",
    city: "Antalya",
    district: "Muratpaşa",
    address: "Konyaaltı Cad. No:78/A",
    experience: "Hobi projeleri ve kişisel kullanım için uygun fiyatlı baskılar.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 5 Plus",
        type: "FDM",
        buildVolume: { x: 350, y: 350, z: 400 },
        materials: ["PLA", "ABS", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil", "Sarı", "Turuncu", "Mor", "Pembe"],
        pricing: { perGram: 0.9, perHour: 10, minOrder: 30 },
      },
      {
        brand: "Anycubic",
        model: "Kobra Max",
        type: "FDM",
        buildVolume: { x: 400, y: 400, z: 450 },
        materials: ["PLA", "PETG", "Wood Fill"],
        colors: ["Siyah", "Beyaz", "Gri", "Kahverengi"],
        pricing: { perGram: 1.0, perHour: 12, minOrder: 35 },
      },
      {
        brand: "Elegoo",
        model: "Mars 3 Pro",
        type: "Resin",
        buildVolume: { x: 143, y: 90, z: 175 },
        materials: ["Resin - Standard", "Resin - Flexible"],
        colors: ["Gri", "Beyaz", "Transparan", "Siyah"],
        pricing: { perGram: 1.8, perHour: 15, minOrder: 50 },
      },
    ],
  },
];

async function seedProviders() {
  console.log("🚀 Provider ve Yazıcı verileri oluşturuluyor...\n");

  for (const providerData of providers) {
    try {
      console.log(`📦 ${providerData.businessName} oluşturuluyor...`);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        providerData.email,
        providerData.password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: providerData.displayName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: providerData.email,
        displayName: providerData.displayName,
        role: "provider",
        isEmailVerified: true,
        verifiedByAdmin: true,
        phoneNumber: `0 (5${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}) ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "providers", user.uid), {
        userId: user.uid,
        businessName: providerData.businessName,
        businessType: providerData.businessType,
        bio: providerData.experience,
        status: "approved",
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        completedOrders: Math.floor(Math.random() * 50) + 10,
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        address: {
          city: providerData.city,
          district: providerData.district,
          fullAddress: providerData.address,
        },
        printers: [],
        bankAccount: null,
      });

      for (const printer of providerData.printers) {
        const printerRef = doc(collection(db, "printers"));
        await setDoc(printerRef, {
          providerId: user.uid,
          brand: printer.brand,
          model: printer.model,
          type: printer.type,
          buildVolume: printer.buildVolume,
          materials: printer.materials,
          colors: printer.colors,
          status: "active",
          pricing: printer.pricing,
          description: `${printer.brand} ${printer.model} - ${printer.type} teknolojisi`,
          createdAt: serverTimestamp(),
        });
        console.log(`   ✅ ${printer.brand} ${printer.model} eklendi`);
      }

      console.log(`✅ ${providerData.businessName} tamamlandı!\n`);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`⚠️  ${providerData.email} zaten mevcut, atlanıyor...\n`);
      } else {
        console.error(`❌ Hata: ${error.message}\n`);
      }
    }
  }

  console.log("🎉 Tüm provider'lar başarıyla oluşturuldu!");
  console.log("\n📋 Provider Listesi:");
  console.log("─".repeat(50));
  providers.forEach((p, i) => {
    console.log(`${i + 1}. ${p.businessName}`);
    console.log(`   📧 ${p.email} / 🔑 ${p.password}`);
    console.log(`   📍 ${p.city}, ${p.district}`);
    console.log(`   🖨️  ${p.printers.length} yazıcı`);
  });

  process.exit(0);
}

seedProviders();

