import React, { useState } from "react";
import { Link } from "react-router-dom";

const SignUp: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === confirmPassword) {
            alert("Signup successful!");
        } else {
            alert("Passwords do not match!");
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full p-2 rounded-lg bg-gray-700 text-white"
                    />
                    <button
                        type="submit"
                        className="w-full p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-500">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
