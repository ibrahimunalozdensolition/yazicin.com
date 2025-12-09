import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, serverTimestamp, GeoPoint, connectFirestoreEmulator, query, where, getDocs, getDoc } from "firebase/firestore";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut } from "firebase/auth";

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
    location: { lat: 40.9848, lng: 29.0244 },
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
    location: { lat: 39.9208, lng: 32.8541 },
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
    location: { lat: 38.4618, lng: 27.2203 },
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
    location: { lat: 40.1826, lng: 29.0665 },
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
    location: { lat: 36.8841, lng: 30.7056 },
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
  {
    email: "provider6@test.com",
    password: "test123456",
    displayName: "TeknoPrint İstanbul",
    businessName: "TeknoPrint İstanbul",
    businessType: "company",
    city: "İstanbul",
    district: "Beşiktaş",
    address: "Levent Mah. Büyükdere Cad. No:200",
    location: { lat: 41.0766, lng: 29.0127 },
    experience: "Yüksek kaliteli endüstriyel 3D baskı hizmetleri. Hızlı prototipleme.",
    printers: [
      {
        brand: "Stratasys",
        model: "Fortus 450mc",
        type: "FDM",
        buildVolume: { x: 406, y: 355, z: 406 },
        materials: ["ABS", "PC", "Nylon", "ASA"],
        colors: ["Beyaz", "Siyah", "Gri", "Kırmızı"],
        pricing: { perGram: 4.0, perHour: 35, minOrder: 250 },
      },
      {
        brand: "3D Systems",
        model: "ProJet MJP 2500",
        type: "MJP",
        buildVolume: { x: 298, y: 185, z: 203 },
        materials: ["Visijet", "Castable"],
        colors: ["Beyaz", "Transparan"],
        pricing: { perGram: 3.5, perHour: 30, minOrder: 200 },
      },
    ],
  },
  {
    email: "provider7@test.com",
    password: "test123456",
    displayName: "Rapid Prototype Ankara",
    businessName: "Rapid Prototype Ankara",
    businessType: "company",
    city: "Ankara",
    district: "Yenimahalle",
    address: "Batıkent Mah. İvedik OSB No:15",
    location: { lat: 39.9688, lng: 32.7306 },
    experience: "Hızlı prototipleme ve küçük seri üretim. Mühendislik destekli tasarım.",
    printers: [
      {
        brand: "Prusa",
        model: "MK4",
        type: "FDM",
        buildVolume: { x: 250, y: 210, z: 210 },
        materials: ["PLA", "PETG", "ABS", "ASA", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Turuncu", "Mavi"],
        pricing: { perGram: 1.6, perHour: 18, minOrder: 50 },
      },
      {
        brand: "BambuLab",
        model: "P1S",
        type: "FDM",
        buildVolume: { x: 256, y: 256, z: 256 },
        materials: ["PLA", "PETG", "ABS", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi"],
        pricing: { perGram: 1.3, perHour: 15, minOrder: 40 },
      },
    ],
  },
  {
    email: "provider8@test.com",
    password: "test123456",
    displayName: "3D Atölye İzmir",
    businessName: "3D Atölye İzmir",
    businessType: "individual",
    city: "İzmir",
    district: "Konak",
    address: "Alsancak Mah. Kordon Boyu No:45",
    location: { lat: 38.4339, lng: 27.1428 },
    experience: "Sanatsal ve dekoratif 3D baskılar. Özel tasarım hizmetleri.",
    printers: [
      {
        brand: "Elegoo",
        model: "Saturn 3 Ultra",
        type: "Resin",
        buildVolume: { x: 218, y: 123, z: 250 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Transparent"],
        colors: ["Gri", "Beyaz", "Transparan", "Siyah", "Mavi"],
        pricing: { perGram: 2.0, perHour: 18, minOrder: 60 },
      },
      {
        brand: "Creality",
        model: "K1 Max",
        type: "FDM",
        buildVolume: { x: 300, y: 300, z: 300 },
        materials: ["PLA", "PETG", "ABS", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi", "Yeşil"],
        pricing: { perGram: 1.1, perHour: 13, minOrder: 35 },
      },
    ],
  },
  {
    email: "provider9@test.com",
    password: "test123456",
    displayName: "Endüstriyel Baskı Bursa",
    businessName: "Endüstriyel Baskı Bursa",
    businessType: "company",
    city: "Bursa",
    district: "Osmangazi",
    address: "Organize Sanayi Bölgesi 1. Cadde No:12",
    location: { lat: 40.1885, lng: 29.0610 },
    experience: "Otomotiv ve endüstriyel parça üretimi. Yüksek dayanıklılık.",
    printers: [
      {
        brand: "Markforged",
        model: "X7",
        type: "FDM",
        buildVolume: { x: 330, y: 270, z: 200 },
        materials: ["Onyx", "Carbon Fiber", "Fiberglass", "Kevlar"],
        colors: ["Siyah"],
        pricing: { perGram: 5.0, perHour: 40, minOrder: 300 },
      },
      {
        brand: "Stratasys",
        model: "F370",
        type: "FDM",
        buildVolume: { x: 355, y: 254, z: 355 },
        materials: ["ABS", "ASA", "PC"],
        colors: ["Beyaz", "Siyah", "Gri", "Kırmızı", "Mavi"],
        pricing: { perGram: 3.8, perHour: 32, minOrder: 250 },
      },
    ],
  },
  {
    email: "provider10@test.com",
    password: "test123456",
    displayName: "Hızlı Baskı Antalya",
    businessName: "Hızlı Baskı Antalya",
    businessType: "individual",
    city: "Antalya",
    district: "Kepez",
    address: "Varsak Mah. Teknokent Bulvarı No:8",
    location: { lat: 36.9014, lng: 30.6903 },
    experience: "Hızlı teslimat ve uygun fiyat. Turizm sektörü için özel ürünler.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 3 S1 Pro",
        type: "FDM",
        buildVolume: { x: 220, y: 220, z: 270 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil", "Sarı"],
        pricing: { perGram: 0.8, perHour: 9, minOrder: 25 },
      },
      {
        brand: "Anycubic",
        model: "Photon M3",
        type: "Resin",
        buildVolume: { x: 192, y: 120, z: 245 },
        materials: ["Resin - Standard", "Resin - Tough"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 1.9, perHour: 16, minOrder: 55 },
      },
    ],
  },
  {
    email: "provider11@test.com",
    password: "test123456",
    displayName: "Adana 3D Solutions",
    businessName: "Adana 3D Solutions",
    businessType: "company",
    city: "Adana",
    district: "Seyhan",
    address: "Kurtuluş Mah. Atatürk Cad. No:150",
    location: { lat: 36.9914, lng: 35.3308 },
    experience: "Tarım ve gıda sektörü için özel parçalar. Dayanıklı malzemeler.",
    printers: [
      {
        brand: "Prusa",
        model: "XL",
        type: "FDM",
        buildVolume: { x: 360, y: 360, z: 360 },
        materials: ["PLA", "PETG", "ABS", "ASA", "PC"],
        colors: ["Siyah", "Beyaz", "Gri", "Turuncu"],
        pricing: { perGram: 1.7, perHour: 19, minOrder: 60 },
      },
      {
        brand: "Raise3D",
        model: "E2",
        type: "FDM",
        buildVolume: { x: 330, y: 240, z: 240 },
        materials: ["PLA", "ABS", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 1.5, perHour: 17, minOrder: 50 },
      },
    ],
  },
  {
    email: "provider12@test.com",
    password: "test123456",
    displayName: "Kocaeli Teknoloji",
    businessName: "Kocaeli Teknoloji",
    businessType: "company",
    city: "Kocaeli",
    district: "İzmit",
    address: "Gebze OSB Teknoloji Parkı No:25",
    location: { lat: 40.7769, lng: 29.9163 },
    experience: "Otomotiv yan sanayi için hassas parça üretimi. Kalite garantili.",
    printers: [
      {
        brand: "Ultimaker",
        model: "S7",
        type: "FDM",
        buildVolume: { x: 330, y: 240, z: 300 },
        materials: ["PLA", "ABS", "PETG", "Nylon", "PC"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 2.2, perHour: 23, minOrder: 90 },
      },
      {
        brand: "Formlabs",
        model: "Form 3L",
        type: "SLA",
        buildVolume: { x: 335, y: 200, z: 300 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Clear"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 3.2, perHour: 27, minOrder: 180 },
      },
    ],
  },
  {
    email: "provider13@test.com",
    password: "test123456",
    displayName: "Gaziantep Maker",
    businessName: "Gaziantep Maker",
    businessType: "individual",
    city: "Gaziantep",
    district: "Şahinbey",
    address: "Organize Sanayi Bölgesi 2. Cadde No:30",
    location: { lat: 37.0662, lng: 37.3833 },
    experience: "Geleneksel el sanatları ile 3D baskı kombinasyonu. Özel tasarımlar.",
    printers: [
      {
        brand: "Creality",
        model: "CR-10 V3",
        type: "FDM",
        buildVolume: { x: 300, y: 300, z: 400 },
        materials: ["PLA", "PETG", "Wood Fill", "Metal Fill"],
        colors: ["Siyah", "Beyaz", "Kahverengi", "Gümüş"],
        pricing: { perGram: 1.0, perHour: 11, minOrder: 30 },
      },
      {
        brand: "Elegoo",
        model: "Neptune 4 Pro",
        type: "FDM",
        buildVolume: { x: 225, y: 225, z: 280 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi"],
        pricing: { perGram: 0.9, perHour: 10, minOrder: 28 },
      },
    ],
  },
  {
    email: "provider14@test.com",
    password: "test123456",
    displayName: "Mersin Prototip",
    businessName: "Mersin Prototip",
    businessType: "company",
    city: "Mersin",
    district: "Yenişehir",
    address: "Çiftçiler Mah. Adnan Menderes Bulvarı No:55",
    location: { lat: 36.8009, lng: 34.6283 },
    experience: "Denizcilik ve lojistik sektörü için özel parçalar. Korozyona dayanıklı.",
    printers: [
      {
        brand: "BambuLab",
        model: "A1 mini",
        type: "FDM",
        buildVolume: { x: 180, y: 180, z: 180 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı", "Mavi"],
        pricing: { perGram: 1.2, perHour: 14, minOrder: 35 },
      },
      {
        brand: "Phrozen",
        model: "Sonic Mini 8K S",
        type: "Resin",
        buildVolume: { x: 181, y: 101, z: 230 },
        materials: ["Resin - Standard", "Resin - Tough"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 2.1, perHour: 19, minOrder: 65 },
      },
    ],
  },
  {
    email: "provider15@test.com",
    password: "test123456",
    displayName: "Konya 3D Atölye",
    businessName: "Konya 3D Atölye",
    businessType: "individual",
    city: "Konya",
    district: "Selçuklu",
    address: "Alaaddin Mah. Mevlana Cad. No:88",
    location: { lat: 37.8746, lng: 32.4932 },
    experience: "Kültürel ve tarihi eser replikaları. Detaylı işçilik.",
    printers: [
      {
        brand: "Elegoo",
        model: "Mars 4 Ultra",
        type: "Resin",
        buildVolume: { x: 192, y: 120, z: 245 },
        materials: ["Resin - Standard", "Resin - Transparent"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 1.8, perHour: 17, minOrder: 50 },
      },
      {
        brand: "Creality",
        model: "Ender 3 V3 SE",
        type: "FDM",
        buildVolume: { x: 220, y: 220, z: 250 },
        materials: ["PLA", "PETG"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi"],
        pricing: { perGram: 0.7, perHour: 8, minOrder: 20 },
      },
    ],
  },
  {
    email: "provider16@test.com",
    password: "test123456",
    displayName: "Eskişehir Tekno",
    businessName: "Eskişehir Tekno",
    businessType: "company",
    city: "Eskişehir",
    district: "Tepebaşı",
    address: "Anadolu Üniversitesi Teknokent No:10",
    location: { lat: 39.7767, lng: 30.5206 },
    experience: "Üniversite-sanayi işbirliği. Araştırma ve geliştirme projeleri.",
    printers: [
      {
        brand: "Prusa",
        model: "MINI+",
        type: "FDM",
        buildVolume: { x: 180, y: 180, z: 180 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Turuncu"],
        pricing: { perGram: 1.4, perHour: 16, minOrder: 40 },
      },
      {
        brand: "Formlabs",
        model: "Form 3B",
        type: "SLA",
        buildVolume: { x: 145, y: 145, z: 185 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Clear"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 2.9, perHour: 24, minOrder: 160 },
      },
    ],
  },
  {
    email: "provider17@test.com",
    password: "test123456",
    displayName: "Sakarya Endüstri",
    businessName: "Sakarya Endüstri",
    businessType: "company",
    city: "Sakarya",
    district: "Serdivan",
    address: "Sakarya Üniversitesi Teknokent No:5",
    location: { lat: 40.7569, lng: 30.3786 },
    experience: "Makine imalat sektörü için hassas parçalar. CNC ile kombinasyon.",
    printers: [
      {
        brand: "Markforged",
        model: "OnX",
        type: "FDM",
        buildVolume: { x: 330, y: 270, z: 200 },
        materials: ["Onyx", "Carbon Fiber"],
        colors: ["Siyah"],
        pricing: { perGram: 4.5, perHour: 38, minOrder: 280 },
      },
      {
        brand: "Ultimaker",
        model: "S3",
        type: "FDM",
        buildVolume: { x: 230, y: 190, z: 200 },
        materials: ["PLA", "ABS", "PETG", "Nylon"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 2.1, perHour: 21, minOrder: 85 },
      },
    ],
  },
  {
    email: "provider18@test.com",
    password: "test123456",
    displayName: "Trabzon Maker Lab",
    businessName: "Trabzon Maker Lab",
    businessType: "individual",
    city: "Trabzon",
    district: "Ortahisar",
    address: "KTÜ Kampüsü Teknokent No:3",
    location: { lat: 41.0015, lng: 39.7178 },
    experience: "Karadeniz bölgesi için özel projeler. Denizcilik parçaları.",
    printers: [
      {
        brand: "Creality",
        model: "CR-6 SE",
        type: "FDM",
        buildVolume: { x: 250, y: 200, z: 200 },
        materials: ["PLA", "PETG", "ABS"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 0.9, perHour: 10, minOrder: 30 },
      },
      {
        brand: "Anycubic",
        model: "Kobra 2",
        type: "FDM",
        buildVolume: { x: 250, y: 250, z: 250 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi"],
        pricing: { perGram: 1.0, perHour: 11, minOrder: 32 },
      },
    ],
  },
  {
    email: "provider19@test.com",
    password: "test123456",
    displayName: "Denizli 3D Print",
    businessName: "Denizli 3D Print",
    businessType: "company",
    city: "Denizli",
    district: "Pamukkale",
    address: "Organize Sanayi Bölgesi No:20",
    location: { lat: 37.7765, lng: 29.0864 },
    experience: "Tekstil makine parçaları ve endüstriyel üretim.",
    printers: [
      {
        brand: "Raise3D",
        model: "Pro3 Plus",
        type: "FDM",
        buildVolume: { x: 300, y: 250, z: 300 },
        materials: ["PLA", "ABS", "PETG", "ASA"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 1.6, perHour: 18, minOrder: 55 },
      },
      {
        brand: "BambuLab",
        model: "X1",
        type: "FDM",
        buildVolume: { x: 256, y: 256, z: 256 },
        materials: ["PLA", "PETG", "ABS", "TPU", "PC"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı"],
        pricing: { perGram: 1.5, perHour: 17, minOrder: 45 },
      },
    ],
  },
  {
    email: "provider20@test.com",
    password: "test123456",
    displayName: "Samsun Teknoloji",
    businessName: "Samsun Teknoloji",
    businessType: "company",
    city: "Samsun",
    district: "İlkadım",
    address: "OMÜ Teknokent No:7",
    location: { lat: 41.2867, lng: 36.3300 },
    experience: "Tarım makineleri için özel parçalar. Dayanıklı malzemeler.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 3 Max Neo",
        type: "FDM",
        buildVolume: { x: 300, y: 300, z: 320 },
        materials: ["PLA", "PETG", "ABS", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı"],
        pricing: { perGram: 1.1, perHour: 12, minOrder: 35 },
      },
      {
        brand: "Elegoo",
        model: "Saturn 2",
        type: "Resin",
        buildVolume: { x: 219, y: 123, z: 250 },
        materials: ["Resin - Standard", "Resin - Tough"],
        colors: ["Gri", "Beyaz", "Siyah"],
        pricing: { perGram: 2.0, perHour: 18, minOrder: 60 },
      },
    ],
  },
  {
    email: "provider21@test.com",
    password: "test123456",
    displayName: "Balıkesir Maker",
    businessName: "Balıkesir Maker",
    businessType: "individual",
    city: "Balıkesir",
    district: "Karesi",
    address: "BAÜ Teknokent No:12",
    location: { lat: 39.6484, lng: 27.8826 },
    experience: "Eğitim ve öğretim materyalleri. Öğrenci projeleri için uygun fiyat.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 3 V2 Neo",
        type: "FDM",
        buildVolume: { x: 220, y: 220, z: 250 },
        materials: ["PLA", "PETG"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil"],
        pricing: { perGram: 0.8, perHour: 9, minOrder: 25 },
      },
      {
        brand: "Anycubic",
        model: "Photon Mono 2",
        type: "Resin",
        buildVolume: { x: 181, y: 101, z: 181 },
        materials: ["Resin - Standard"],
        colors: ["Gri", "Beyaz"],
        pricing: { perGram: 1.7, perHour: 15, minOrder: 45 },
      },
    ],
  },
  {
    email: "provider22@test.com",
    password: "test123456",
    displayName: "Malatya 3D",
    businessName: "Malatya 3D",
    businessType: "company",
    city: "Malatya",
    district: "Battalgazi",
    address: "İnönü Üniversitesi Teknokent No:8",
    location: { lat: 38.3552, lng: 38.3095 },
    experience: "Tarım ve gıda işleme makineleri için parçalar.",
    printers: [
      {
        brand: "Prusa",
        model: "i3 MK3S+",
        type: "FDM",
        buildVolume: { x: 250, y: 210, z: 210 },
        materials: ["PLA", "PETG", "ABS", "ASA"],
        colors: ["Siyah", "Beyaz", "Gri", "Turuncu"],
        pricing: { perGram: 1.5, perHour: 17, minOrder: 50 },
      },
      {
        brand: "BambuLab",
        model: "P1P",
        type: "FDM",
        buildVolume: { x: 256, y: 256, z: 256 },
        materials: ["PLA", "PETG", "ABS", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 1.3, perHour: 15, minOrder: 40 },
      },
    ],
  },
  {
    email: "provider23@test.com",
    password: "test123456",
    displayName: "Erzurum Tekno",
    businessName: "Erzurum Tekno",
    businessType: "individual",
    city: "Erzurum",
    district: "Yakutiye",
    address: "Atatürk Üniversitesi Teknokent No:4",
    location: { lat: 39.9043, lng: 41.2679 },
    experience: "Soğuk iklim koşullarına uygun parçalar. Yüksek dayanıklılık.",
    printers: [
      {
        brand: "Creality",
        model: "CR-10 V2",
        type: "FDM",
        buildVolume: { x: 300, y: 300, z: 400 },
        materials: ["PLA", "PETG", "ABS", "ASA"],
        colors: ["Siyah", "Beyaz", "Gri"],
        pricing: { perGram: 1.0, perHour: 11, minOrder: 30 },
      },
      {
        brand: "Raise3D",
        model: "E2CF",
        type: "FDM",
        buildVolume: { x: 330, y: 240, z: 240 },
        materials: ["PLA", "ABS", "PETG", "Carbon Fiber"],
        colors: ["Siyah"],
        pricing: { perGram: 1.8, perHour: 20, minOrder: 60 },
      },
    ],
  },
  {
    email: "provider24@test.com",
    password: "test123456",
    displayName: "Kayseri Endüstriyel",
    businessName: "Kayseri Endüstriyel",
    businessType: "company",
    city: "Kayseri",
    district: "Melikgazi",
    address: "Organize Sanayi Bölgesi No:35",
    location: { lat: 38.7312, lng: 35.4787 },
    experience: "Mobilya ve dekorasyon sektörü için özel parçalar.",
    printers: [
      {
        brand: "Ultimaker",
        model: "S5",
        type: "FDM",
        buildVolume: { x: 330, y: 240, z: 300 },
        materials: ["PLA", "ABS", "PETG", "Nylon", "Wood Fill"],
        colors: ["Siyah", "Beyaz", "Gri", "Kahverengi"],
        pricing: { perGram: 2.0, perHour: 22, minOrder: 80 },
      },
      {
        brand: "Formlabs",
        model: "Form 3",
        type: "SLA",
        buildVolume: { x: 145, y: 145, z: 185 },
        materials: ["Resin - Standard", "Resin - Tough", "Resin - Clear"],
        colors: ["Gri", "Beyaz", "Transparan"],
        pricing: { perGram: 3.0, perHour: 25, minOrder: 150 },
      },
    ],
  },
  {
    email: "provider25@test.com",
    password: "test123456",
    displayName: "Van 3D Solutions",
    businessName: "Van 3D Solutions",
    businessType: "company",
    city: "Van",
    district: "İpekyolu",
    address: "Van Yüzüncü Yıl Üniversitesi Teknokent No:6",
    location: { lat: 38.4891, lng: 43.4089 },
    experience: "Bölgesel ihtiyaçlara yönelik özel çözümler. Hızlı teslimat.",
    printers: [
      {
        brand: "Creality",
        model: "Ender 5 S1",
        type: "FDM",
        buildVolume: { x: 220, y: 220, z: 300 },
        materials: ["PLA", "PETG", "ABS", "TPU"],
        colors: ["Siyah", "Beyaz", "Kırmızı", "Mavi", "Yeşil"],
        pricing: { perGram: 0.9, perHour: 10, minOrder: 28 },
      },
      {
        brand: "Elegoo",
        model: "Mars 4",
        type: "Resin",
        buildVolume: { x: 192, y: 120, z: 245 },
        materials: ["Resin - Standard", "Resin - Tough"],
        colors: ["Gri", "Beyaz", "Siyah"],
        pricing: { perGram: 1.9, perHour: 17, minOrder: 55 },
      },
      {
        brand: "BambuLab",
        model: "A1",
        type: "FDM",
        buildVolume: { x: 256, y: 256, z: 256 },
        materials: ["PLA", "PETG", "TPU"],
        colors: ["Siyah", "Beyaz", "Gri", "Kırmızı"],
        pricing: { perGram: 1.2, perHour: 14, minOrder: 38 },
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

      const providerDoc: any = {
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
      };

      if (providerData.location) {
        providerDoc.location = new GeoPoint(providerData.location.lat, providerData.location.lng);
      }

      await setDoc(doc(db, "providers", user.uid), providerDoc);

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
        console.log(`⚠️  ${providerData.email} zaten mevcut, yazıcılar kontrol ediliyor...`);
        
        try {
          const auth = getAuth();
          const userCredential = await signInWithEmailAndPassword(auth, providerData.email, providerData.password);
          const existingUser = userCredential.user;

          const providerDocRef = doc(db, "providers", existingUser.uid);
          const existingProviderDoc = await getDoc(providerDocRef);

          if (!existingProviderDoc.exists()) {
            console.log(`   📋 Provider document oluşturuluyor...`);
            const providerDoc: any = {
              userId: existingUser.uid,
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
            };

            if (providerData.location) {
              providerDoc.location = new GeoPoint(providerData.location.lat, providerData.location.lng);
            }

            await setDoc(providerDocRef, providerDoc);
            console.log(`   ✅ Provider document oluşturuldu`);
          }

          const printersQuery = query(
            collection(db, "printers"),
            where("providerId", "==", existingUser.uid)
          );
          const printersSnapshot = await getDocs(printersQuery);

          if (printersSnapshot.empty) {
            console.log(`   📦 Yazıcılar ekleniyor...`);
            for (const printer of providerData.printers) {
              const printerRef = doc(collection(db, "printers"));
              await setDoc(printerRef, {
                providerId: existingUser.uid,
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
            console.log(`✅ ${providerData.businessName} yazıcıları eklendi!\n`);
          } else {
            console.log(`   ⚠️  Yazıcılar zaten mevcut (${printersSnapshot.size} adet)\n`);
          }

          await signOut(auth);
        } catch (signInError) {
          console.error(`❌ Giriş yapılamadı:`, signInError);
        }
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

