"use client";
import { useRouter } from "next/navigation";
import { LoginForm } from "./components/login-form";

import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
          email: "",
          password: "",
      });
  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("http://localhost:8080/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        const data = await response.json(); 
        console.log(data)
        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem('bio', data.bio);
            setMessage(data.message || "Login successful!");
            router.push("/home"); 
        } else {
            setMessage(data.message || "Invalid credentials.");
        }
    } catch (error) {
        console.error("Error:", error);
        setMessage("An error occurred. Please try again.");
    }
};
  
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Welcome to Project Tinder</h1>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
      <button onClick={() => router.push("/auth/login")}>
        Regular Auth Login
      </button>
      <button onClick={() => router.push("http://localhost:8080/oauth2/authorization/google")}>
        OAuth Login
      </button>
      <button onClick={() => router.push("/auth/login/register")}>
        Register
      </button>
    </div>
  );
}
