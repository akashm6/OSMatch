'use client'
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function OAuthSuccessPage() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {

        const token = params.get("token");
        const userId = params.get("userId");
        if(token) {
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);
            router.push("/home");
        }
    }, []);

    console.log(params);

    return <p>Logging in...</p>;
    
    
}