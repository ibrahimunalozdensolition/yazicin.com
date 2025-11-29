import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      email, 
      displayName, 
      phoneNumber, 
      businessName, 
      businessType,
      city,
      district,
      address,
      printerBrand,
      printerModel,
      printerType,
      experience 
    } = body;

    if (!userId || !email || !phoneNumber || !businessName || !city || !printerBrand || !printerModel) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      );
    }

    const existingQuery = query(
      collection(db, "providerApplications"),
      where("userId", "==", userId)
    );
    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      return NextResponse.json(
        { error: "Bu kullanıcı için zaten bir başvuru mevcut" },
        { status: 409 }
      );
    }

    const docRef = await addDoc(collection(db, "providerApplications"), {
      userId,
      email,
      displayName,
      phoneNumber,
      businessName,
      businessType,
      city,
      district,
      address,
      printerBrand,
      printerModel,
      printerType,
      experience,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json(
      { success: true, id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Provider application error:", error);
    return NextResponse.json(
      { error: "Başvuru gönderilemedi" },
      { status: 500 }
    );
  }
}

