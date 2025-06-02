"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const validateToken = async () => {
      try {
        const res = await fetch("http://localhost:8080/protected/jwt", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
           console.log(res.json())
           console.log(res)
          router.push("/");
          return;
        }

        const data = await res.json();
        setUserId(data.userId);
        setUsername(data.username);
        fetchLikedProjects(data.userId);
      } catch (error) {
        console.error(error);
      }
    };
    validateToken();
  }, []);

  const fetchLikedProjects = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/profile/likedProjects?userId=${id}`
      );
      const data = await res.json();
      console.log(data)
      setLikedProjects(data);
    } catch (err) {
      console.error("Error fetching liked projects:", err);
    }
  };

  const groupedByLanguage = likedProjects.reduce((acc, project) => {
    const lang = project.primaryLanguage || "Unknown";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(project);
    return acc;
  }, {});

  return (
    <div className="p-6 dark:bg-background">
      <h1 className="text-3xl font-bold mb-6 text-foreground">{username}'s Liked Projects</h1>
      {Object.keys(groupedByLanguage).length === 0 ? (
        <p className="text-muted-foreground">No liked projects yet.</p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {Object.entries(groupedByLanguage).map(([language, projects]) => (
            <AccordionItem value={language} key={language}>
              <AccordionTrigger className="text-lg font-semibold text-foreground">
                {language}
              </AccordionTrigger>
              <AccordionContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, idx) => (
                  <Card
                    key={idx}
                    className="hover:shadow-lg transition cursor-pointer bg-card text-foreground"
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader>
                      <CardTitle className="truncate">{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>{selectedProject?.description}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Repository:</span> {selectedProject?.repo_name}
            </p>
            <p>
              <span className="font-semibold">Language:</span> {selectedProject?.primaryLanguage}
            </p>
            <p>
              <span className="font-semibold">Issue:</span> {selectedProject?.title}
            </p>
            <p>
              <span className="font-semibold">Labels:</span> {selectedProject?.labels || "No labels available."}
            </p>
            <p>
              <span className="font-semibold">Topics:</span> {selectedProject?.topics || "No topics available."}
            </p>
          </div>
          <div className="mt-4">
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
