import { User } from '../types/user';

export const verifyToken = async (token: string): Promise<User | null> => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
            headers: {
                'x-auth-token': token
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            return null;
        }
        
        return response.json();
    } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        return null;
    }
}; 