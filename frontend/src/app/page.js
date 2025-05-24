"use client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Welcome to Project Tinder</h1>
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
