import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface UserData {
  id: number;
  email: string;
  business_id: number;
  roles?: string[];
}

export interface BusinessData {
  id: number;
  name: string;
  slug: string;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  user: UserData | null;
  business: BusinessData | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}



const loadInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      business: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const storage = localStorage.getItem('access_token') ? localStorage : 
                  sessionStorage.getItem('access_token') ? sessionStorage : null;

  if (!storage) {
    return {
      user: null,
      business: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  const accessToken = storage.getItem('access_token');
  const refreshToken = storage.getItem('refresh_token');
  const expiresAt = storage.getItem('token_expiry');
  const userStr = localStorage.getItem('user');
  const businessStr = localStorage.getItem('business');

  // Check if token is expired
  const expiryTime = expiresAt ? parseInt(expiresAt, 10) : 0;
  const isExpired = expiryTime > 0 && Date.now() >= expiryTime;

  if (isExpired || !accessToken) {
    return {
      user: null,
      business: null,
      accessToken: null,
      refreshToken: refreshToken, // Keep refresh token to allow refresh attempts
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  return {
    user: userStr ? JSON.parse(userStr) : null,
    business: businessStr ? JSON.parse(businessStr) : null,
    accessToken,
    refreshToken,
    expiresAt: expiryTime,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  };
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }: { email: string; password: string; rememberMe: boolean }, { rejectWithValue }) => {
    try {
      // Login request
      const response = await fetch(`${API_BASE_URL}/auth/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Invalid credentials');
      }

      // Store tokens
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('access_token', data.access_token);
      storage.setItem('refresh_token', data.refresh_token);
      storage.setItem('token_expiry', (Date.now() + data.expires_in * 1000).toString());

      // Fetch user details
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });

      let user = null;
      if (meResponse.ok) {
        user = await meResponse.json();
        localStorage.setItem('user', JSON.stringify(user));
        if (user.roles) {
          localStorage.setItem('roles', JSON.stringify(user.roles));
        }
      }

      // Fetch business details if user has business_id
      let business = null;
      if (user?.business_id) {
        // Note: You might need a specific endpoint to get business details
        // For now, we'll store what we have
        const businessStr = localStorage.getItem('business');
        if (businessStr) {
          business = JSON.parse(businessStr);
        }
      }

      return {
        user,
        business,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ 
    email, 
    password, 
    businessName,
    supportEmail 
  }: { 
    email: string; 
    password: string; 
    businessName: string;
    supportEmail?: string;
  }, { rejectWithValue }) => {
    try {
      const requestBody: { email: string; password: string; business_name: string; support_email?: string } = {
        email,
        password,
        business_name: businessName,
      };
      
      if (supportEmail && supportEmail.trim()) {
        requestBody.support_email = supportEmail.trim();
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Registration failed');
      }

      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expiry', (Date.now() + data.expires_in * 1000).toString());
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('business', JSON.stringify(data.business));
      localStorage.setItem('roles', JSON.stringify(data.roles));

      return {
        user: data.user,
        business: data.business,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/sessions/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore errors
      }
    }

    // Clear all storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
    localStorage.removeItem('roles');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('token_expiry');
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.accessToken;

    if (!token) {
      return rejectWithValue('No token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to fetch user');
      }

      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      if (user.roles) {
        localStorage.setItem('roles', JSON.stringify(user.roles));
      }

      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const refreshTokenValue = state.auth.refreshToken;

    if (!refreshTokenValue) {
      return rejectWithValue('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/sessions/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        return rejectWithValue('Failed to refresh token');
      }

      const data = await response.json();
      
      // Check if using localStorage or sessionStorage based on what's currently stored
      const hasLocalToken = typeof window !== 'undefined' && localStorage.getItem('access_token') !== null;
      const hasSessionToken = typeof window !== 'undefined' && sessionStorage.getItem('access_token') !== null;
      const storage = hasLocalToken ? localStorage : hasSessionToken ? sessionStorage : localStorage;
      
      storage.setItem('access_token', data.access_token);
      storage.setItem('refresh_token', data.refresh_token);
      storage.setItem('token_expiry', (Date.now() + data.expires_in * 1000).toString());

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        roles: data.roles,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    initializeAuth: (state) => {
      const newState = loadInitialState();
      state.user = newState.user;
      state.business = newState.business;
      state.accessToken = newState.accessToken;
      state.refreshToken = newState.refreshToken;
      state.expiresAt = newState.expiresAt;
      state.isAuthenticated = newState.isAuthenticated;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.business = action.payload.business;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.business = action.payload.business;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
      state.isAuthenticated = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.business = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // Fetch Current User
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.user = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.isAuthenticated = false;
    });

    // Refresh Token
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = Date.now() + action.payload.expiresIn * 1000;
      if (action.payload.roles) {
        state.user = state.user ? { ...state.user, roles: action.payload.roles } : null;
      }
    });
    builder.addCase(refreshToken.rejected, (state) => {
      state.user = null;
      state.business = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, initializeAuth } = authSlice.actions;
export default authSlice.reducer;
