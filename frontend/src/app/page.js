"use client";
import { motion } from "framer-motion";
import { LoginForm } from "./components/login-form";
import FloatingIcons from "./components/FloatingIcons";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden dark">
      <FloatingIcons />\
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.h1
            initial={{ textShadow: "0 0 0px #ffffff" }}
            animate={{ 
              textShadow: [
                "0 0 0px #ffffff",
                "0 0 8px #a855f7",
                "0 0 12px #9333ea",
                "0 0 8px #a855f7",
                "0 0 0px #ffffff"
              ] 
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-4xl font-extrabold text-center text-purple-400 drop-shadow-md mb-6"
          >
          OSMatch
        </motion.h1>
        <div className="w-full max-w-sm bg-card p-6 rounded-lg shadow-lg backdrop-blur-md border border-border">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
