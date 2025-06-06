import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, GitFork, Eye, Tag, FolderGit2 } from "lucide-react";

export default function ProjectCard({ project }) {
  if (!project) return null;

  return (
    <Card className="bg-muted/10 text-foreground rounded-xl shadow-xl border border-border">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{project.title}</h2>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            <span className="font-medium">{project.repo_name}</span>
          </div>
        </div>

        {project.description && (
          <p className="text-base text-muted-foreground">{project.description}</p>
        )}

        {project.bodyText && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {project.bodyText.slice(0, 300)}...
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
          <span><strong>Language:</strong> {project.primaryLanguage}</span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-400" />
            {project.stargazerCount} Stars
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-4 w-4 text-blue-400" />
            {project.forkCount ?? "N/A"} Forks
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-green-400" />
            {project.watchers ?? "N/A"} Watchers
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {project.labels?.map((label, idx) => (
            <span key={idx} className="bg-indigo-500/10 text-blue-300 text-xs px-3 py-1 rounded-full">
              {label}
            </span>
          ))}
          {project.topics?.map((topic, idx) => (
            <span key={idx} className="bg-purple-500/10 text-purple-300 text-xs px-3 py-1 rounded-full">
              {topic}
            </span>
          ))}
        </div>

        <Button asChild className="mt-4">
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            View Project
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
