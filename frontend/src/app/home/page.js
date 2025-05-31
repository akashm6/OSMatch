"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "../components/ProjectCard";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/ui/app-sidebar";

export default function Home() {
  const router = useRouter();
  const [currentUserId, setUserId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  // Check token validity
  useEffect(() => {
    const token = localStorage.getItem("token");
    const validateToken = async () => {
        try {
            const res = await fetch("http://localhost:8080/protected/jwt", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        if(!res.ok) {
            router.push('/')
            return;
        }
        else{
            const data = await res.json();
            handleLanguageChange("python");
            setUserId(data.userId);
            fetchRecommendations(data.userId)
        }
    }
        catch(error) {
            console.error(error);
        }
    }
    validateToken();
    }, [router]);

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    if (currentUserId) {
      try {
        await fetch("http://localhost:8000/reset/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: Number(currentUserId), language: lang }),
        });
        fetchRecommendations(currentUserId);
      } catch (error) {
        console.error("Error resetting model:", error);
      }
    }
  };

  const fetchRecommendations = async (id) => {
    try {
      const res = await fetch(`http://localhost:8000/recommendations/?user_id=${id}`);
      const data = await res.json();
      if (Array.isArray(data.recommended_repos)) {
        setProjects(data.recommended_repos);
        setCurrentProjectIndex(0);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleSwipe = async (direction) => {
    if (!currentUserId || projects.length === 0) return;
    const project = projects[currentProjectIndex];
    const payload = {
      user_id: Number(currentUserId),
      project,
      direction,
    };

    console.log("Sending swipe payload:", payload);

    try {
      // Send to ML model
      const res = await fetch("http://localhost:8000/swipe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();
      console.log("Response from swipe:", responseData);

      // Save to DB if right swipe
      if (direction === "right") {
        await fetch("http://localhost:8080/swipeRight/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(currentUserId),
            project,
            direction,
          }),
        });
      }

      // Advance to next
      const nextIndex = currentProjectIndex + 1;
      if (nextIndex < projects.length) {
        setCurrentProjectIndex(nextIndex);
      } else {
        fetchRecommendations(currentUserId);
      }
    } catch (error) {
      console.error("Error swiping:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  return (
    <SidebarProvider>
      <AppSidebar
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 dark:border-neutral-800">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Your Recs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Swiping</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 dark:bg-background">
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-card rounded-lg p-4 shadow-md text-center">
              <h2 className="text-sm font-semibold text-muted-foreground">Total Projects</h2>
              <p className="text-xl font-bold text-foreground">238</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md text-center">
              <h2 className="text-sm font-semibold text-muted-foreground">Languages Swiped</h2>
              <p className="text-xl font-bold text-foreground">12</p>
            </div>
            <div className="bg-card rounded-lg p-4 shadow-md text-center">
              <h2 className="text-sm font-semibold text-muted-foreground">Matches</h2>
              <p className="text-xl font-bold text-foreground">56</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Swipe Project</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <ProjectCard project={projects[currentProjectIndex]} />
              ) : (
                <p>Loading projects...</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleSwipe("left")}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold transition duration-200 hover:shadow-[0_0_10px_#dc2626]"
            >
              ⬅ Left
            </button>
            <button
              onClick={() => handleSwipe("right")}
              className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold transition duration-200 hover:shadow-[0_0_10px_#16a34a]"
            >
              ➡ Right
            </button>
            <button
              onClick={goToProfile}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold transition duration-200 hover:shadow-[0_0_10px_#3b82f6]"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-lg bg-neutral-700 text-white font-semibold transition duration-200 hover:shadow-[0_0_10px_#a3a3a3]"
            >
              Logout
            </button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
