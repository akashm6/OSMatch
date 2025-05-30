import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, GitFork, Eye } from "lucide-react"

export default function ProjectCard({ project }) {
  if (!project) return null

  return (
    <Card className="bg-background text-foreground rounded-xl shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT: Main Info */}
          <div className="flex-1 space-y-3">
            <h2 className="text-xl font-semibold">{project.title}</h2>

            <p className="text-lg text-muted-foreground">
              <strong>Repository:</strong> {project.repo_name}
            </p>

            {project.description && (
              <p className="text-lg text-muted-foreground">
                <strong>Description:</strong> {project.description}
              </p>
            )}

            {project.bodyText && (
              <p className="text-lg text-muted-foreground">
                <strong>Issue Details:</strong>{" "}
                {project.bodyText.slice(0, 200)}...
              </p>
            )}

            <p className="text-lg text-muted-foreground">
              <strong>Language:</strong> {project.primaryLanguage}
            </p>

            <Button asChild>
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                View Project
              </a>
            </Button>
          </div>

          {/* RIGHT: Stats + Labels/Topics */}
          <div className="flex flex-col gap-4 w-full lg:w-64">
            {/* Stats Card */}
            <Card className="h-40 bg-muted/40 shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">{project.stargazerCount} Stars</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">{project.forkCount ?? "N/A"} Forks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-400" />
                  <span className="text-sm">{project.watchers ?? "N/A"} Watchers</span>
                </div>
              </CardContent>
            </Card>

            {/* Labels/Topics Card */}
            <Card className="h-40 bg-muted/40 shadow">
              <CardContent className="p-4 space-y-2">
                {project.labels?.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Labels:</strong> {project.labels.join(", ")}
                  </p>
                )}
                {project.topics?.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Topics:</strong> {project.topics.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
