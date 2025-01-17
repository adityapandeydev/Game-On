import React, { useState } from "react";
import { Link } from "react-router-dom";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement login logic here
        alert("Login successful!"); // Example login success logic
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>
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
