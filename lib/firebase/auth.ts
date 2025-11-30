import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  ActionCodeSettings
} from "firebase/auth";
import { auth } from "./config";

const getActionCodeSettings = (redirectPath: string = "/"): ActionCodeSettings => ({
  url: typeof window !== "undefined" 
    ? `${window.location.origin}${redirectPath}`
    : `https://yazicin.com${redirectPath}`,
  handleCodeInApp: true,
});

export const AuthService = {
  register: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  },

  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  },

  logout: async () => {
    await signOut(auth);
  },

  resetPassword: async (email: string) => {
    const actionCodeSettings = getActionCodeSettings("/login");
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  },

  sendVerificationEmail: async (user: User, redirectPath: string = "/customer") => {
    const actionCodeSettings = getActionCodeSettings(redirectPath);
    await sendEmailVerification(user, actionCodeSettings);
  }
};

