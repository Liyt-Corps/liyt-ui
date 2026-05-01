const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserData {
  id: number;
  email: string;
  business_id: number;
}

export interface BusinessData {
  id: number;
  name: string;
  slug: string;
}

export const auth = {
  // Get token from storage
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  },

  // Get refresh token from storage
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const expiry = this.getTokenExpiry();
    if (expiry && Date.now() >= expiry) {
      return false;
    }

    return true;
  },

  // Get token expiry time
  getTokenExpiry(): number | null {
    if (typeof window === "undefined") return null;
    const expiry = localStorage.getItem("token_expiry") || sessionStorage.getItem("token_expiry");
    return expiry ? parseInt(expiry, 10) : null;
  },

  // Get user data
  getUser(): UserData | null {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get business data
  getBusiness(): BusinessData | null {
    if (typeof window === "undefined") return null;
    const business = localStorage.getItem("business");
    return business ? JSON.parse(business) : null;
  },

  // Get user roles
  getRoles(): string[] {
    if (typeof window === "undefined") return [];
    const roles = localStorage.getItem("roles");
    return roles ? JSON.parse(roles) : [];
  },

  // Set auth data
  setAuth(data: TokenData & { user?: UserData; business?: BusinessData; roles?: string[] }, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("access_token", data.access_token);
    storage.setItem("refresh_token", data.refresh_token);

    const expiryTime = Date.now() + data.expires_in * 1000;
    storage.setItem("token_expiry", expiryTime.toString());

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    if (data.business) {
      localStorage.setItem("business", JSON.stringify(data.business));
    }
    if (data.roles) {
      localStorage.setItem("roles", JSON.stringify(data.roles));
    }
  },

  // Clear auth data
  clearAuth() {
    if (typeof window === "undefined") return;

    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("user");
    localStorage.removeItem("business");
    localStorage.removeItem("roles");

    // Clear sessionStorage
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("token_expiry");
  },

  // Refresh token
  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/sessions/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.clearAuth();
        return false;
      }

      const data = await response.json();

      // Check if using localStorage or sessionStorage for the original token
      const isRememberMe = localStorage.getItem("access_token") !== null;
      this.setAuth(data, isRememberMe);

      return true;
    } catch {
      return false;
    }
  },

  // Revoke token (logout)
  async revokeToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/sessions/revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore errors
      }
    }

    this.clearAuth();
  },

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  // Make authenticated API request
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newHeaders = {
          ...this.getAuthHeaders(),
          ...(options.headers || {}),
        };
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
      } else {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return response;
  },
};

export default auth;
