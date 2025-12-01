import { collection, addDoc, getDocs, doc, getDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./config";

export interface Review {
  id?: string;
  orderId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export const ReviewService = {
  create: async (data: Omit<Review, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "reviews"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getByOrderId: async (orderId: string): Promise<Review | null> => {
    const q = query(
      collection(db, "reviews"),
      where("orderId", "==", orderId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Review;
  },

  getByProviderId: async (providerId: string): Promise<Review[]> => {
    const q = query(
      collection(db, "reviews"),
      where("providerId", "==", providerId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
    return reviews.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getByCustomerId: async (customerId: string): Promise<Review[]> => {
    const q = query(
      collection(db, "reviews"),
      where("customerId", "==", customerId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];
    return reviews.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
  },

  getAverageRating: async (providerId: string): Promise<{ average: number; count: number }> => {
    const reviews = await ReviewService.getByProviderId(providerId);
    if (reviews.length === 0) return { average: 0, count: 0 };
    
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return {
      average: Math.round((total / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },

  hasReviewed: async (orderId: string): Promise<boolean> => {
    const review = await ReviewService.getByOrderId(orderId);
    return review !== null;
  },
};

