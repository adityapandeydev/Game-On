import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            console.log('Sending login request for:', email);
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Raw server response:', JSON.stringify(data, null, 2));
            
            if (!response.ok) {
                throw new Error(data.msg || 'Login failed');
            }

            // Validate response data structure
            if (!data.token) {
                console.error('Missing token in response');
                throw new Error('Invalid server response: missing token');
            }
            if (!data.user) {
                console.error('Missing user data in response. Full response:', data);
                throw new Error('Invalid server response: missing user data');
            }
            if (!data.user.id || !data.user.name || !data.user.email) {
                console.error('Incomplete user data:', data.user);
                throw new Error('Invalid server response: incomplete user data');
            }

            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            onLogin();
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>
                {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
                    >
                        Log In
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-blue-500">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
