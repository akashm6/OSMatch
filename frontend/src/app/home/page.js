"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "../components/ProjectCard";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";

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
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [userStats, setUserStats] = useState({
    totalSwipes: 0,
    totalMatches: 0,
  });
  const [filteredCount, setFilteredCount] = useState(0);

  // Check token validity and also grab the user stats
  useEffect(() => {
    const token = localStorage.getItem("token");
    const validateToken = async () => {
      try {
        const res = await fetch("http://localhost:8080/protected/jwt", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.push("/");
          return;
        } else {
          const data = await res.json();
          handleLanguageChange("python");
          setUserId(data.userId);
          setUserStats({
            totalSwipes: data.totalSwipes,
            totalMatches: data.totalMatches,
          });
          fetchRecommendations(data.userId);
        }
      } catch (error) {
        console.error(error);
      }
    };

    validateToken();
  }, [router]);

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    if (currentUserId) {
      try {
        await fetch("http://localhost:8000/reset/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(currentUserId),
            language: lang,
          }),
        });
        fetchRecommendations(currentUserId);
      } catch (error) {
        console.error("Error resetting model:", error);
      }
    }
  };

  const fetchRecommendations = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8000/recommendations/?user_id=${id}`
      );
      const data = await res.json();
      if (Array.isArray(data.recommended_repos)) {
        setProjects(data.recommended_repos);
        setCurrentProjectIndex(0);
        setFilteredCount(data.filtered_count || 0);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleSwipe = async (direction) => {
    if (!currentUserId || projects.length === 0) return;
    if (direction === "right") {
      setUserStats({
        totalMatches: userStats.totalMatches + 1,
        totalSwipes: userStats.totalSwipes + 1,
      });
    } else {
      setUserStats({
        totalMatches: userStats.totalMatches,
        totalSwipes: userStats.totalSwipes + 1,
      });
    }
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

      // Send to Java backend to update
      if (direction === "right") {
        try {
          await fetch("http://localhost:8080/swipeRight/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(currentUserId),
              issueUrl: project.url,
              direction,
            }),
          });
        } catch (error) {
          console.error(error);
        }
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

  const handleLogout = async () => {
    const payload = {
      ...userStats,
      userId: Number(currentUserId),
    };
    try {
      const res = await fetch("http://localhost:8080/updateStats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(error);
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <Card className="bg-gradient-to-br from-indigo-900/60 to-indigo-700/30 border border-indigo-500 shadow-[0_0_20px_#6366f1] text-white hover:shadow-[0_0_25px_#6366f1]/60 transition">
              <CardHeader className="text-center">
                <CardTitle className="text-sm font-semibold tracking-wide text-indigo-200">
                  Total Swipes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{userStats.totalSwipes}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/60 to-purple-700/30 border border-purple-500 shadow-[0_0_20px_#8b5cf6] text-white hover:shadow-[0_0_25px_#8b5cf6]/60 transition">
              <CardHeader className="text-center">
                <CardTitle className="text-sm font-semibold tracking-wide text-purple-200">
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-3xl font-bold">{userStats.totalMatches}</p>
              </CardContent>
            </Card>

            <Card className="relative bg-card rounded-lg p-4 pt-6 shadow-md text-center">
              <div className="absolute top-2 right-2">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 text-sm">
                    Number of recommended projects filtered out because you've
                    already swiped on them.
                  </HoverCardContent>
                </HoverCard>
              </div>

              <h2 className="text-sm font-semibold text-muted-foreground">
                Filtered Projects
              </h2>
              <p className="text-3xl pt-5 font-bold">
                {userStats.filteredCount ?? 0}
              </p>
            </Card>
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
