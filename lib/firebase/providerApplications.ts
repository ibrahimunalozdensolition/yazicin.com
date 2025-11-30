import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, orderBy, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./config";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ProviderApplication {
  id?: string;
  userId: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  businessName: string;
  businessType: "individual" | "company";
  city: string;
  district: string;
  address: string;
  printerBrand: string;
  printerModel: string;
  experience: string;
  status: ApplicationStatus;
  adminNote?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export const ProviderApplicationService = {
  submit: async (data: Omit<ProviderApplication, "id" | "status" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "providerApplications"), {
      ...data,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getAll: async (): Promise<ProviderApplication[]> => {
    const q = query(collection(db, "providerApplications"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProviderApplication[];
  },

  getByStatus: async (status: ApplicationStatus): Promise<ProviderApplication[]> => {
    const q = query(
      collection(db, "providerApplications"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProviderApplication[];
  },

  getByUserId: async (userId: string): Promise<ProviderApplication | null> => {
    const q = query(collection(db, "providerApplications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ProviderApplication;
  },

  getById: async (id: string): Promise<ProviderApplication | null> => {
    const docRef = doc(db, "providerApplications", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as ProviderApplication;
  },

  approve: async (id: string, adminId: string) => {
    const docRef = doc(db, "providerApplications", id);
    await updateDoc(docRef, {
      status: "approved",
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
    });
  },

  reject: async (id: string, adminId: string, adminNote?: string) => {
    const docRef = doc(db, "providerApplications", id);
    await updateDoc(docRef, {
      status: "rejected",
      adminNote: adminNote || "",
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
    });
  },
};

