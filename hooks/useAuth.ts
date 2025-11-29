import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/lib/firebase/auth";

export const useAuthActions = () => {
  return AuthService;
};

export { useAuth };

