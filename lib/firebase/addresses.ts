import { Timestamp, GeoPoint } from "firebase/firestore";

export interface Address {
  id?: string;
  userId: string;
  title: string;
  city: string;
  district: string;
  fullAddress: string;
  zipCode?: string;
  isDefault: boolean;
  location?: GeoPoint;
  createdAt: Timestamp;
}

