import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "./config";

export interface Message {
  id?: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "provider";
  content: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface Conversation {
  orderId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCustomer: number;
  unreadProvider: number;
}

export const MessageService = {
  send: async (data: Omit<Message, "id" | "isRead" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "messages"), {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "conversations"), {
      orderId: data.orderId,
    }).catch(() => {});

    return docRef.id;
  },

  getByOrderId: async (orderId: string): Promise<Message[]> => {
    const q = query(
      collection(db, "messages"),
      where("orderId", "==", orderId)
    );
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
    return messages.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
  },

  markAsRead: async (messageIds: string[]) => {
    const promises = messageIds.map((id) => {
      const docRef = doc(db, "messages", id);
      return updateDoc(docRef, { isRead: true });
    });
    await Promise.all(promises);
  },

  getUnreadCount: async (orderId: string, role: "customer" | "provider"): Promise<number> => {
    const oppositeRole = role === "customer" ? "provider" : "customer";
    const q = query(
      collection(db, "messages"),
      where("orderId", "==", orderId),
      where("senderRole", "==", oppositeRole),
      where("isRead", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  },

  subscribeToMessages: (orderId: string, callback: (messages: Message[]) => void) => {
    const q = query(
      collection(db, "messages"),
      where("orderId", "==", orderId)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      callback(messages.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds));
    });
  },
};

