import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';

// API Base URL - adjust as needed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'iqx_access_token';
const REFRESH_TOKEN_KEY = 'iqx_refresh_token';

// Token management
export const TokenService = {
    getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

    setTokens: (accessToken: string, refreshToken: string) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },

    clearTokens: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    hasTokens: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
};

// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - attach token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = TokenService.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(null);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue the request while refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = TokenService.getRefreshToken();

            if (refreshToken) {
                try {
                    const response = await axios.post<TokenPair>(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token } = response.data;
                    TokenService.setTokens(access_token, refresh_token);

                    processQueue();
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError);
                    TokenService.clearTokens();
                    // Dispatch custom event for auth state change
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                TokenService.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:logout'));
            }
        }

        return Promise.reject(error);
    }
);

// ==================== API Types (from OpenAPI spec) ====================

/**
 * POST /auth/login request body
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Token pair response
 */
export interface TokenPair {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

/**
 * User profile from /auth/me
 */
export interface UserProfile {
    id: number;
    email: string;
    fullname: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    last_login_at: string | null;
    created_at: string;
}

/**
 * POST /auth/login response
 */
export interface AuthResponse {
    user: UserProfile;
    tokens: TokenPair;
}

/**
 * POST /auth/refresh request body
 */
export interface RefreshRequest {
    refresh_token: string;
}

/**
 * POST /auth/logout request body
 */
export interface LogoutRequest {
    refresh_token?: string | null;
    all?: boolean;
}

/**
 * Message response (e.g., logout success)
 */
export interface MessageResponse {
    message: string;
}

// ==================== Auth API endpoints ====================

export const AuthAPI = {
    /**
     * Login user
     * POST /auth/login
     */
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', {
            email,
            password,
        } as LoginRequest);
        return response.data;
    },

    /**
     * Logout user
     * POST /auth/logout
     */
    logout: async (refreshToken?: string | null, all = false): Promise<MessageResponse> => {
        try {
            const response = await api.post<MessageResponse>('/auth/logout', {
                refresh_token: refreshToken,
                all,
            } as LogoutRequest);
            return response.data;
        } finally {
            TokenService.clearTokens();
        }
    },

    /**
     * Get current user profile
     * GET /auth/me
     */
    getMe: async (): Promise<UserProfile> => {
        const response = await api.get<UserProfile>('/auth/me');
        return response.data;
    },

    /**
     * Refresh access token
     * POST /auth/refresh
     */
    refresh: async (refreshToken: string): Promise<TokenPair> => {
        const response = await api.post<TokenPair>('/auth/refresh', {
            refresh_token: refreshToken,
        } as RefreshRequest);
        return response.data;
    },
};

// ==================== Error handling helpers ====================

export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const response = error.response;

        // Handle specific error status codes
        if (response?.status === 401) {
            return 'Email hoặc mật khẩu không đúng';
        }
        if (response?.status === 403) {
            return 'Tài khoản của bạn đã bị khóa';
        }
        if (response?.status === 422) {
            // Validation error from FastAPI
            const detail = response.data?.detail;
            if (Array.isArray(detail)) {
                return detail.map((d: { msg: string }) => d.msg).join(', ');
            }
            return typeof detail === 'string' ? detail : 'Dữ liệu không hợp lệ';
        }
        if (response?.status === 500) {
            return 'Lỗi máy chủ. Vui lòng thử lại sau';
        }

        // Network error
        if (error.code === 'ERR_NETWORK') {
            return 'Không thể kết nối đến máy chủ';
        }

        // Timeout
        if (error.code === 'ECONNABORTED') {
            return 'Yêu cầu quá thời gian chờ';
        }

        // Generic error message from server
        return response?.data?.detail || response?.data?.message || 'Đã có lỗi xảy ra';
    }

    return 'Đã có lỗi xảy ra';
};

export default api;
