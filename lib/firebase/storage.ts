import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTaskSnapshot } from "firebase/storage";
import { storage } from "./config";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

export const StorageService = {
  uploadSTL: (
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `stl-files/${userId}/${timestamp}_${safeName}`;
      const storageRef = ref(storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || "application/octet-stream",
        customMetadata: {
          originalName: file.name,
          uploadedBy: userId,
        },
      });

      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
          });
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            url,
            path,
            uploadedAt: new Date(),
          });
        }
      );
    });
  },

  uploadImage: (
    file: File,
    folder: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileMetadata> => {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const path = `${folder}/${userId}/${timestamp}.${ext}`;
      const storageRef = ref(storage, path);
      
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
      });

      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
          });
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            url,
            path,
            uploadedAt: new Date(),
          });
        }
      );
    });
  },

  deleteFile: async (path: string): Promise<void> => {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  },

  getDownloadUrl: async (path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  },
};

export const validateSTLFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024;
  const allowedExtensions = [".stl", ".obj"];
  
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: "Sadece STL ve OBJ dosyaları kabul edilmektedir." };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: "Dosya boyutu 100MB'dan büyük olamaz." };
  }
  
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

