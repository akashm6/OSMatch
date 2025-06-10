'use client';

import { Suspense } from "react";

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<p>Logging in...</p>}>
      <OAuthRedirectHandler />
    </Suspense>
  );
}

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

function OAuthRedirectHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("userId");

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      router.push("/home");
    }
  }, [params, router]);

  return <p>Logging in...</p>;
}