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
      <button onClick={() => router.push("/oauth2/authorization/github")}>
        OAuth Login
      </button>
      <button onClick={() => router.push("/auth/register")}>
        Register
      </button>
    </div>
  );
}
