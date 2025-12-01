import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./config";

export type PrinterStatus = "active" | "maintenance" | "busy" | "inactive";
export type PrinterType = "FDM" | "SLA" | "SLS" | "DLP" | "Resin";

export interface PrinterPricing {
  perGram: number;
  perHour: number;
  minOrder: number;
}

export interface Printer {
  id?: string;
  providerId: string;
  brand: string;
  model: string;
  type: PrinterType;
  buildVolume: {
    x: number;
    y: number;
    z: number;
  };
  materials: string[];
  colors: string[];
  status: PrinterStatus;
  pricing: PrinterPricing;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const PrinterService = {
  create: async (data: Omit<Printer, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "printers"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getById: async (id: string): Promise<Printer | null> => {
    const docRef = doc(db, "printers", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Printer;
  },

  getByProviderId: async (providerId: string): Promise<Printer[]> => {
    const q = query(
      collection(db, "printers"),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    const printers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Printer[];
    return printers.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getActive: async (): Promise<Printer[]> => {
    const q = query(
      collection(db, "printers"),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    const printers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Printer[];
    return printers.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getAll: async (): Promise<Printer[]> => {
    const q = query(collection(db, "printers"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Printer[];
  },

  update: async (id: string, data: Partial<Printer>) => {
    const docRef = doc(db, "printers", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  updateStatus: async (id: string, status: PrinterStatus) => {
    const docRef = doc(db, "printers", id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, "printers", id));
  },
};

export const MATERIALS = [
  "PLA",
  "ABS",
  "PETG",
  "TPU",
  "Nylon",
  "PC",
  "ASA",
  "HIPS",
  "PVA",
  "Wood Fill",
  "Carbon Fiber",
  "Metal Fill",
  "Resin - Standard",
  "Resin - Tough",
  "Resin - Flexible",
  "Resin - Dental",
];

export const COLORS = [
  "Siyah",
  "Beyaz",
  "Gri",
  "Kırmızı",
  "Mavi",
  "Yeşil",
  "Sarı",
  "Turuncu",
  "Mor",
  "Pembe",
  "Kahverengi",
  "Transparan",
  "Gümüş",
  "Altın",
];

