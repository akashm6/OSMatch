"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DoubleRingSpinner from "../components/DoubleRingSpinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const [likedProjects, setLikedProjects] = useState([]);
  const [username, setUsername] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortOption, setSortOption] = useState("recency");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const validateToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/protected/jwt`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setUserId(data.userId);
        setUsername(data.username);
        await fetchLikedProjects(data.userId);
      } catch (error) {
        console.error(error);
      }
    };
    validateToken();
  }, []);

  const fetchLikedProjects = async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SPRINGBOOT_API}/profile/likedProjects?userId=${id}`);
      const data = await res.json();
      setLikedProjects(data);
    } catch (err) {
      console.error("Error fetching liked projects:", err);
    }
  };

  const sortProjects = (projects) => {
    if (sortOption === "name") {
      return [...projects].sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB);
      });
    }
    return [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  };

  const groupedByLanguage = likedProjects.reduce((acc, project) => {
    const rawLang = project.primaryLanguage || "Unknown";
    const normKey = rawLang.trim().toLowerCase();
    const displayName = normKey.charAt(0).toUpperCase() + normKey.slice(1);

    if (!acc[normKey]) {
      acc[normKey] = {
        displayName,
        projects: []
      };
    }
    acc[normKey].projects.push(project);
    return acc;
  }, {});

  return (
    <div className="p-6 dark:bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground">
          {username}&apos;s Liked Projects
        </h1>
        <Button onClick={() => router.push("/home")} className="bg-muted text-foreground hover:bg-muted/70">
          Go Back
        </Button>
      </div>

      {Object.keys(groupedByLanguage).length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <DoubleRingSpinner />
          <p className="text-lg font-semibold text-foreground">Loading Liked Projects...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4 max-w-6xl mx-auto">
            <label className="text-sm font-medium text-muted-foreground mr-2">Sort by:</label>
            <select
              className="bg-background border border-border rounded px-2 py-1 text-sm"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="recency">Most Recent</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <Accordion type="multiple" className="w-full max-w-6xl mx-auto">
            {Object.entries(groupedByLanguage).map(([_, { displayName, projects }]) => {
              const sortedProjects = sortProjects(projects);
              return (
                <AccordionItem value={displayName} key={displayName}>
                  <AccordionTrigger className="text-lg font-semibold text-foreground">
                    {displayName} ({projects.length})
                  </AccordionTrigger>
                  <AccordionContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedProjects.map((project, idx) => (
                      <Card
                        key={idx}
                        className="p-4 rounded-xl border border-muted bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        onClick={() => setSelectedProject(project)}
                      >
                        <CardHeader className="p-0 mb-2">
                          <CardTitle className="truncate text-lg font-semibold">{project.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {project.description || "No description"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </>
      )}

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="bg-card text-foreground border-border max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>{selectedProject?.description}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Repository:</span> {selectedProject?.repoName || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Language:</span> {selectedProject?.primaryLanguage}
            </p>
            <p>
              <span className="font-semibold">Issue:</span> {selectedProject?.title}
            </p>
            <p className="font-semibold mt-4">Labels:</p>
            {selectedProject?.labels ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedProject.labels.substring(1, selectedProject.labels.length - 1).split(',').map((label, i) => (
                  <span
                    key={i}
                    className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {label.replace(/["]+/g, "").trim()}
                  </span>
                ))}
              </div>
            ) : (
              <span>No labels available.</span>
            )}
            <p className="font-semibold mt-4">Topics:</p>
            {selectedProject?.topics ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedProject.topics.substring(1, selectedProject.topics.length - 1).split(',').map((topic, i) => (
                  <span
                    key={i}
                    className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {topic.replace(/["]+/g, "").trim()}
                  </span>
                ))}
              </div>
            ) : (
              <span>No topics available.</span>
            )}
            <p><span className="font-semibold">Stars:</span> {selectedProject?.stargazerCount ?? 0}</p>
            <p><span className="font-semibold">Forks:</span> {selectedProject?.forkCount ?? 0}</p>
            <p><span className="font-semibold">Watchers:</span> {selectedProject?.watchers ?? 0}</p>
          </div>

          <div className="mt-6">
            <a
              href={selectedProject?.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button className="bg-primary text-black hover:shadow-[0_0_10px_#4f46e5] transition">
                View Project
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}