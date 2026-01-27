import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthAPI, TokenService, getErrorMessage, type UserProfile } from '@/lib/api';

interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullname?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check auth status on mount
    const checkAuth = useCallback(async () => {
        if (!TokenService.hasTokens()) {
            setIsLoading(false);
            return;
        }

        try {
            const userData = await AuthAPI.getMe();
            setUser(userData);
        } catch {
            TokenService.clearTokens();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Listen for logout events from API interceptor
    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // Call login API - returns { user, tokens }
            const response = await AuthAPI.login(email, password);

            // Save tokens
            TokenService.setTokens(
                response.tokens.access_token,
                response.tokens.refresh_token
            );

            // Set user from response (no need for additional getMe call)
            setUser(response.user);
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    };

    const register = async (email: string, password: string, fullname?: string) => {
        try {
            // Call register API - returns { user, tokens }
            const response = await AuthAPI.register(email, password, fullname);

            // Save tokens
            TokenService.setTokens(
                response.tokens.access_token,
                response.tokens.refresh_token
            );

            // Set user from response
            setUser(response.user);
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    };

    const logout = async () => {
        try {
            const refreshToken = TokenService.getRefreshToken();
            await AuthAPI.logout(refreshToken);
        } finally {
            setUser(null);
            TokenService.clearTokens();
        }
    };

    const refreshUser = async () => {
        if (TokenService.hasTokens()) {
            try {
                const userData = await AuthAPI.getMe();
                setUser(userData);
            } catch {
                setUser(null);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
