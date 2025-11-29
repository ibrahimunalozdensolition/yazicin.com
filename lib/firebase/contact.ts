import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./config";

export interface ContactForm {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export const ContactService = {
  submit: async (data: Omit<ContactForm, "id" | "status" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "contactForms"), {
      ...data,
      status: "new",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getAll: async (): Promise<ContactForm[]> => {
    const q = query(collection(db, "contactForms"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ContactForm[];
  },

  updateStatus: async (id: string, status: ContactForm["status"]) => {
    const docRef = doc(db, "contactForms", id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  delete: async (id: string) => {
    await deleteDoc(doc(db, "contactForms", id));
  },
};

