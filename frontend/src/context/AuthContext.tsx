import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User } from '../types/user';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoggedIn: boolean;
    setUser: (user: User | null) => void;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                const userDataString = localStorage.getItem('user');
                
                if (token && userDataString) {
                    try {
                        const userData = JSON.parse(userDataString);
                        if (userData?.id) {
                            setUser(userData);
                            setIsLoggedIn(true);
                        } else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                        }
                    } catch {
                        console.warn('Invalid user data in localStorage');
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                // Clear potentially corrupted data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        isLoggedIn,
        setUser,
        setIsLoggedIn
    }), [user, loading, isLoggedIn]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 