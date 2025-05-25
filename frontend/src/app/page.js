"use client";
import { useRouter } from "next/navigation";
import { LoginForm } from "./components/login-form";

export default function LandingPage() {
  const router = useRouter();

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
