import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            // Send login request to the backend
            const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            const { token } = response.data;

            // Store the token in localStorage or sessionStorage
            localStorage.setItem('token', token);

            // Set login state in parent component (App)
            onLogin();
        } catch (error: unknown) {
            setError('Invalid email or password');
            console.log(error)
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
