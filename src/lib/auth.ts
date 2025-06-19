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
    const response = await authAPI.login(username, password);

    if (response.success && response.data) {
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
      }

      return response.data.user;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;

  // Try to get user from localStorage first (for immediate access)
  const userData = localStorage.getItem("currentUser");
  if (userData) {
    return JSON.parse(userData);
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