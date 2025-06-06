"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "../components/ProjectCard";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import DoubleRingSpinner from "../components/DoubleRingSpinner";

export default function Home() {
  const router = useRouter();
  const [currentUserId, setUserId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noMoreProjects, setNoMoreProjects] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [userStats, setUserStats] = useState({
    totalSwipes: 0,
    totalMatches: 0,
  });
  const [topInterest, setTopInterest] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedLang = localStorage.getItem("selectedLanguage") || "python";

    const validateTokenAndStats = async () => {
      try {
        const res = await fetch("http://localhost:8080/protected/jwt", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          handleLogout();
          return;
        }

        const data = await res.json();
        setUserId(data.userId);

        const cachedStats = localStorage.getItem("userStats");
        if(cachedStats) {
          setUserStats(JSON.parse(cachedStats));
        }
        else {
          const statsFromBackend = {
            totalSwipes: data.totalSwipes,
            totalMatches: data.totalMatches,
          };
          setUserStats(statsFromBackend);
          localStorage.setItem("userStats", JSON.stringify(statsFromBackend));
        }
        
        handleLanguageChange(savedLang, data.userId);
      } catch (error) {
        console.error(error);
      }
    };

    validateTokenAndStats();
    
  }, [router]);

  useEffect(() => {
    console.log("📌 topInterest updated:", topInterest);
  }, [topInterest]);

  useEffect(() => {
    const checkExhaustion = async () => {
      if (!currentUserId || !selectedLanguage) return;
      try {
        const res = await fetch(
          `http://localhost:8000/exhaustion/?user_id=${currentUserId}&language=${encodeURIComponent(
            selectedLanguage
          )}`
        );
        const data = await res.json();
        setNoMoreProjects(data.exhausted); 
      } catch (err) {
        console.error("Error checking exhaustion:", err);
      }
    };

    checkExhaustion();
  }, [currentUserId, selectedLanguage]);

  const handleLanguageChange = async (lang, userIdOverride = null) => {
    const userId = userIdOverride || currentUserId;
    setSelectedLanguage(lang);
    localStorage.setItem("selectedLanguage", lang);
    if (userId) {
      try {
        await fetchRecommendations(userId, lang);
      } catch (error) {
        console.error("Error fetching for new language:", error);
      }
    } else {
      console.warn("User ID not available yet");
    }
  };

  const fetchRecommendations = async (id, lang) => {
    setIsLoading(true);
    setNoMoreProjects(false); 

    try {
      const res = await fetch(
        `http://localhost:8000/recommendations/?user_id=${id}&language=${encodeURIComponent(
          lang
        )}`
      );
      const data = await res.json();
      console.log("Fetched recommendations:", data);

      if (data.message && data.message.includes("Come back later")) {
        localStorage.setItem(`exhausted:${lang}`, "true");
        setProjects([]);
        setNoMoreProjects(true);
        return;
      } else {
        localStorage.setItem(`exhausted:${lang}`, "false");
      }

      if (Array.isArray(data.recommended_repos)) {
        setProjects(data.recommended_repos);
        setCurrentProjectIndex(0);

        const normalizedInterest = Array.isArray(data.top_interest)
          ? data.top_interest
          : [data.top_interest || "N/A"];

        setTopInterest((prev) => {
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(normalizedInterest);
          return prevStr !== newStr ? normalizedInterest : prev;
        });
      } else {
        setProjects([]);
        setNoMoreProjects(true);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setNoMoreProjects(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (!currentUserId || projects.length === 0 || isSwiping || noMoreProjects)
      return;

    setIsSwiping(true);

    setUserStats((prev) => {
      const updated = {
        totalSwipes: prev.totalSwipes + 1,
        totalMatches:
          direction === "right" ? prev.totalMatches + 1 : prev.totalMatches,
        };
        localStorage.setItem("userStats", JSON.stringify(updated));
        return updated;
    });

    const project = projects[currentProjectIndex];
    const payload = {
      user_id: Number(currentUserId),
      project,
      direction,
    };

    try {
      const swipeRes = await fetch("http://localhost:8000/swipe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const swipeData = await swipeRes.json();

      if (direction === "right") {
        await fetch("http://localhost:8080/swipeRight/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: Number(currentUserId),
            issueUrl: project.url,
            direction,
          }),
        });
      }

      const nextIndex = currentProjectIndex + 1;
      if (nextIndex < projects.length) {
        setCurrentProjectIndex(nextIndex);
      } else {
        setProjects([]);
      }

      if (swipeData.model_trained) {
        await fetchRecommendations(currentUserId, selectedLanguage);
      }

      if (nextIndex >= projects.length && !swipeData.model_trained) {
        await fetchRecommendations(currentUserId, selectedLanguage);
      }
    } catch (error) {
      console.error("Error swiping:", error);
    } finally {
      setIsSwiping(false);
    }
  };

  const handleLogout = async () => {
    const payload = {
      ...userStats,
      userId: Number(currentUserId),
    };
    try {
      await fetch("http://localhost:8080/updateStats", {
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
                <BreadcrumbLink>Your Recs</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 dark:bg-background">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <Card className="bg-gradient-to-br from-green-900/60 to-green-700/30 border border-green-500 shadow-[0_0_20px_#16a34a]/40 text-white">
              <CardHeader>
                <CardTitle className="text-sm text-green-200">
                  Total Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userStats.totalMatches}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/60 to-red-700/30 border border-red-500 shadow-[0_0_20px_#dc2626]/40 text-white">
              <CardHeader>
                <CardTitle className="text-sm text-red-200">
                  Total Swipes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{userStats.totalSwipes}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border border-indigo-700 shadow-inner">
              <CardHeader>
                <CardTitle className="text-sm text-indigo-300 flex items-center gap-1">
                  Top Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(topInterest)
                  ? topInterest.join(", ")
                  : topInterest}
              </CardContent>
            </Card>
          </div>

          <Card className="flex flex-col max-h-[60vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Swipe Project</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <DoubleRingSpinner />
              ) : noMoreProjects ? (
                <div className="text-center text-gray-400 dark:text-gray-300 py-6">
                  🎉 You've swiped through all available projects in this
                  language!
                  <br />
                  Check back tomorrow for new issues or switch languages.
                </div>
              ) : (
                <div className="min-h-[40vh] max-h-[50vh] overflow-y-auto">
                  <ProjectCard project={projects[currentProjectIndex]} />
                </div>
              )}
            </CardContent>
          </Card>

          {isSwiping && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 border-solid"></div>
            </div>
          )}

          <div className="sticky bottom-4 z-10 flex justify-center">
            <div className="bg-muted/10 border border-border px-6 py-4 rounded-xl flex flex-wrap gap-4 shadow-lg backdrop-blur-md">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="px-6 py-2">Help</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>How does this work?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>Left Swipe:</strong> Left swipes skip the project. You can see it again later.<br />
                        <strong>Right Swipe:</strong> Interested? Right swipes save projects to your profile.
                      </AlertDialogDescription>

                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>Got it</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="destructive"
                onClick={() => handleSwipe("left")}
                className="flex items-center gap-2 px-6 py-2"
              >
                &larr; Left
              </Button>
              <Button
                onClick={() => handleSwipe("right")}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
              >
                &rarr; Right
              </Button>
              <Button
                variant="secondary"
                onClick={goToProfile}
                className="px-6 py-2"
              >
                Profile
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="px-6 py-2"
              >
                Logout
              </Button>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
