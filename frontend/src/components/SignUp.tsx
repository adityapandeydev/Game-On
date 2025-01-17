import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp: React.FC = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(""); // Store error messages
    const navigate = useNavigate(); // Navigate after successful signup

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            // Send signup request to backend
            const response = await axios.post("http://localhost:5000/api/auth/signup", {
                name,
                email,
                password,
            });

            const { token } = response.data;

            // Store the token in localStorage
            localStorage.setItem("token", token);

            // Redirect user to the game grid page
            navigate("/");

        } catch (error: unknown) {
            setError("An error occurred");
            console.log(error);
        }
    };

    return (
        <div className="flex justify-center items-center h-full">
            <div className="w-96 bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
                {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
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
