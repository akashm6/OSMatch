import React from "react";

const ProjectCard = ({ project }) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
        padding: "20px",
        margin: "20px auto",
        maxWidth: "700px",
        transition: "transform 0.2s",
      }}
    >
      <h2 style={{ marginBottom: "10px", color: "#333", fontFamily: "Montserrat, sans-serif" }}>
        {project.title}
      </h2>
      <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
        <strong>Repository:</strong> {project.repo_name}
      </p>
      {project.description && (
        <p style={{ fontSize: "14px", color: "#555", margin: "5px 0" }}>
          <strong>Description:</strong> {project.description}
        </p>
      )}
      {project.bodyText && (
        <p style={{ fontSize: "12px", color: "#777", margin: "5px 0" }}>
          <strong>Issue Details:</strong> {project.bodyText.slice(0, 100)}...
        </p>
      )}
      <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
        <strong>Language:</strong> {project.primaryLanguage}
      </p>
      <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
        <strong>Stars:</strong> {project.stargazerCount} &nbsp;&bull;&nbsp;
        <strong>Forks:</strong> {project.forkCount || "N/A"} &nbsp;&bull;&nbsp;
        <strong>Watchers:</strong> {project.watchers || "N/A"}
      </p>
      <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
        <strong>Labels:</strong> {project.labels.join(", ")}
      </p>
      <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>
        <strong>Topics:</strong> {project.topics.join(", ")}
      </p>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: "15px",
          padding: "10px 20px",
          background: "#0070f3",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        View Project
      </a>
    </div>
  );
};

export default ProjectCard;
