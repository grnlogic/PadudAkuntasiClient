// Updated auth.ts to use API calls
import { authAPI } from "./api";

export interface User {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN_DIVISI";
  division?: {
    id: string;
    name: string;
  };
  // ✅ ADDED: Support flat structure from backend (snake_case)
  division_id?: number;
  division_name?: string;
  perusahaan_id?: number; // ✅ NEW: Company ID from backend
  status: "active" | "inactive";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Authentication using API
export const authenticateUser = async (
  username: string,
  password: string
): Promise<User | null> => {
  try {
    console.log("🔐 [AUTH] Attempting login for:", username);
    const response = await authAPI.login(username, password);

    console.log("📥 [AUTH] Login response:", {
      success: response.success,
      hasData: !!response.data,
      hasToken: !!(response.data?.token),
      hasUser: !!(response.data?.user),
      userData: response.data?.user,
      error: response.error,
      fullResponse: response,
      fullData: response.data
    });

    if (response.success && response.data) {
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
        console.log("✅ [AUTH] Token stored successfully");
      } else {
        console.warn("⚠️ [AUTH] No token in response!");
      }

      if (response.data.user) {
        console.log("✅ [AUTH] User data:", response.data.user);
        
        // ✅ FIXED: Convert flat structure to nested structure for frontend compatibility
        const userData: User = {
          id: String(response.data.user.id),
          username: response.data.user.username,
          role: response.data.user.role,
          division: response.data.user.division_id ? {
            id: String(response.data.user.division_id),
            name: response.data.user.division_name || "Unknown Division"
          } : undefined,
          // Keep flat structure for backward compatibility
          division_id: response.data.user.division_id,
          division_name: response.data.user.division_name,
          perusahaan_id: response.data.user.perusahaan_id, // ✅ NEW: Include company ID
          status: "active"
        };
        
        console.log("🔄 [AUTH] Converted user data:", userData);
        setCurrentUser(userData);
        
        return userData;
      } else {
        console.warn("⚠️ [AUTH] No user data in response!");
      }
    }

    console.error("❌ [AUTH] Login failed:", response.error || "Unknown error");
    return null;
  } catch (error) {
    console.error("💥 [AUTH] Exception during login:", error);
    return null;
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;

  // Try to get user from localStorage first (for immediate access)
  const userData = localStorage.getItem("currentUser");
  if (userData) {
    const user = JSON.parse(userData);
    
    // ✅ FIXED: Ensure backward compatibility - convert flat to nested if needed
    if (user.division_id && !user.division) {
      user.division = {
        id: String(user.division_id),
        name: user.division_name || "Unknown Division"
      };
    }
    
    return user;
  }

  // If no local data, we should fetch from API
  // This will be handled by the components using useEffect
  return null;
};

export const setCurrentUser = (user: User | null) => {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("auth_token");
  }
};

export const logout = async (): Promise<void> => {
  try {
    await authAPI.logout();
  } catch (error) {
    // Silent error handling
  } finally {
    // Clear local storage regardless of API response
    setCurrentUser(null);
  }
};

// Fetch current user from API (for components to use)
export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await authAPI.getCurrentUser();

    if (response.success && response.data) {
      setCurrentUser(response.data);
      return response.data;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// ✅ Add debug function untuk check division mapping
export const debugUserDivision = (user: User | null) => {
  if (!user) {
    return;
  }

  // Debug information can be logged in development only
  if (process.env.NODE_ENV === "development") {
    // Optional: Keep debug logging only in development
  }
};
