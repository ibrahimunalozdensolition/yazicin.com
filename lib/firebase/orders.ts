import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, orderBy, where, serverTimestamp, Timestamp, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "./config";

export type OrderStatus = "pending" | "accepted" | "in_production" | "shipped" | "delivered" | "cancelled";

export type PrintQuality = "draft" | "normal" | "fine";

export interface PrintSettings {
  material: string;
  color: string;
  infill: number;
  quality: PrintQuality;
  quantity: number;
}

export interface Order {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  providerId: string;
  providerName: string;
  printerId: string;
  printerName: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  printSettings: PrintSettings;
  price: number;
  shippingAddress: {
    city: string;
    district: string;
    fullAddress: string;
  };
  status: OrderStatus;
  trackingNumber?: string;
  trackingCompany?: string;
  notes?: string;
  productionHours?: number;
  productionStartedAt?: Timestamp;
  proposedPrice?: number;
  priceChangeStatus?: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  acceptedAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancelReason?: string;
}

export const OrderService = {
  create: async (data: Omit<Order, "id" | "status" | "createdAt" | "updatedAt">) => {
    const docRef = await addDoc(collection(db, "orders"), {
      ...data,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getById: async (id: string): Promise<Order | null> => {
    const docRef = doc(db, "orders", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Order;
  },

  getByCustomerId: async (customerId: string): Promise<Order[]> => {
    const q = query(
      collection(db, "orders"),
      where("customerId", "==", customerId)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
    return orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getByProviderId: async (providerId: string): Promise<Order[]> => {
    const q = query(
      collection(db, "orders"),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
    return orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getByStatus: async (status: OrderStatus): Promise<Order[]> => {
    const q = query(
      collection(db, "orders"),
      where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];
    return orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  updateStatus: async (id: string, status: OrderStatus, additionalData?: Partial<Order>) => {
    const docRef = doc(db, "orders", id);
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === "accepted") {
      updateData.acceptedAt = serverTimestamp();
    } else if (status === "in_production") {
      updateData.productionStartedAt = serverTimestamp();
    } else if (status === "shipped") {
      updateData.shippedAt = serverTimestamp();
    } else if (status === "delivered") {
      updateData.deliveredAt = serverTimestamp();
    } else if (status === "cancelled") {
      updateData.cancelledAt = serverTimestamp();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await updateDoc(docRef, updateData);
  },

  addTrackingInfo: async (id: string, trackingNumber: string, trackingCompany: string) => {
    const docRef = doc(db, "orders", id);
    await updateDoc(docRef, {
      trackingNumber,
      trackingCompany,
      updatedAt: serverTimestamp(),
    });
  },

  cancel: async (id: string, reason: string) => {
    const docRef = doc(db, "orders", id);
    await updateDoc(docRef, {
      status: "cancelled",
      cancelReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  subscribeToOrder: (id: string, callback: (order: Order | null) => void): Unsubscribe => {
    const docRef = doc(db, "orders", id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        callback(null);
      }
    });
  },

  subscribeToProviderOrders: (providerId: string, callback: (orders: Order[]) => void): Unsubscribe => {
    const q = query(
      collection(db, "orders"),
      where("providerId", "==", providerId)
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      const sortedOrders = orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(sortedOrders);
    });
  },

  proposePriceChange: async (id: string, newPrice: number) => {
    const docRef = doc(db, "orders", id);
    await updateDoc(docRef, {
      proposedPrice: newPrice,
      priceChangeStatus: "pending",
      updatedAt: serverTimestamp(),
    });
  },

  respondToPriceChange: async (id: string, accept: boolean) => {
    const docRef = doc(db, "orders", id);
    const orderDoc = await getDoc(docRef);
    if (!orderDoc.exists()) return;

    const orderData = orderDoc.data() as Order;
    const updateData: Record<string, any> = {
      priceChangeStatus: accept ? "accepted" : "rejected",
      updatedAt: serverTimestamp(),
    };

    if (accept && orderData.proposedPrice) {
      updateData.price = orderData.proposedPrice;
      updateData.proposedPrice = null;
    } else if (!accept) {
      updateData.proposedPrice = null;
    }

    await updateDoc(docRef, updateData);
  },
};

