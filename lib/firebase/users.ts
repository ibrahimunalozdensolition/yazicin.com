import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { User } from "firebase/auth";

export type UserRole = "customer" | "provider" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: any;
  updatedAt: any;
  isEmailVerified: boolean;
  verifiedByAdmin: boolean;
  providerId?: string;
}

export const UserService = {
  createUserProfile: async (user: User, additionalData: { role: UserRole }) => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { email, displayName, photoURL, phoneNumber, emailVerified } = user;
      const createdAt = serverTimestamp();

      const newProfile: Record<string, any> = {
        uid: user.uid,
        email: email || "",
        displayName: displayName || "",
        role: additionalData.role,
        isEmailVerified: emailVerified || false,
        verifiedByAdmin: false,
        createdAt,
        updatedAt: createdAt,
      };

      if (photoURL) {
        newProfile.photoURL = photoURL;
      }
      if (phoneNumber) {
        newProfile.phoneNumber = phoneNumber;
      }

      try {
        await setDoc(userRef, newProfile);
        
        if (additionalData.role === "provider") {
            const providerRef = doc(db, "providers", user.uid);
            await setDoc(providerRef, {
                userId: user.uid,
                businessName: displayName || "",
                status: "pending",
                createdAt: serverTimestamp(),
                completedOrders: 0,
                rating: 0
            });
        }

      } catch (error) {
        console.error("Error creating user profile", error);
      }
    }
  },

  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  },

  updateUserProfile: async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  ensureUserProfile: async (user: User, role: UserRole = "customer") => {
    if (!user) return null;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { email, displayName, photoURL, phoneNumber, emailVerified } = user;
      const createdAt = serverTimestamp();

      const newProfile: Record<string, any> = {
        uid: user.uid,
        email: email || "",
        displayName: displayName || "",
        role,
        isEmailVerified: emailVerified || false,
        verifiedByAdmin: false,
        createdAt,
        updatedAt: createdAt,
      };

      if (photoURL) newProfile.photoURL = photoURL;
      if (phoneNumber) newProfile.phoneNumber = phoneNumber;

      await setDoc(userRef, newProfile);
      return newProfile as UserProfile;
    }

    return userSnap.data() as UserProfile;
  }
};
