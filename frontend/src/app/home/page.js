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
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/ui/app-sidebar";

export default function Home() {
  const router = useRouter();
  const [currentUserId, setUserId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/protected/jwt", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) router.push("/");
    });
  }, []);

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
  
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchRecommendations(storedUserId);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchRecommendations = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8000/recommendations/?user_id=${id}`
      );
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
    const payload = { user_id: Number(currentUserId), project, direction };

    try {
      await fetch("http://localhost:8000/swipe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  return (
    <SidebarProvider>
      <AppSidebar
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 dark:border-neutral-800">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
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

        <div className="flex flex-1 flex-col gap-4 p-4 dark:bg-background">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
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

          <div className="flex gap-6">
            <Button onClick={() => handleSwipe("left")} variant="outline">
              👎 Left
            </Button>
            <Button onClick={() => handleSwipe("right")}>
              👍 Right
            </Button>
            <Button onClick={() => router.push("/profile")} variant="secondary">
              Profile
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
