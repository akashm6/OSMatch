"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectCard from "../components/ProjectCard"; 

const Home = () => {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [projects, setProjects] = useState([]); 
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("r");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchRecommendations(storedUserId);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchRecommendations = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/recommendations/?user_id=${userId}`);
      const data = await res.json();
      if (data.recommended_repos && Array.isArray(data.recommended_repos)) {
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
    if (!userId || projects.length === 0) return;
    const project = projects[currentProjectIndex];
    const payload = {
      user_id: Number(userId),
      project,
      direction,
    };

    console.log("Sending swipe payload:", payload);

    try {
      const res = await fetch("http://localhost:8000/swipe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();
      console.log("Response from swipe:", responseData);

      const nextIndex = currentProjectIndex + 1;
      if (nextIndex < projects.length) {
        setCurrentProjectIndex(nextIndex);
      } else {
        fetchRecommendations(userId);
      }
    } catch (error) {
      console.error("Error swiping:", error);
    }
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    if (userId) {
      try {
        await fetch("http://localhost:8000/reset/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: Number(userId), language: newLanguage }),
        });
      } catch (error) {
        console.error("Error resetting model:", error);
      }
      fetchRecommendations(userId);
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Project Tinder</h1>
      </header>
      <section style={languageSectionStyle}>
        <h3 style={sectionTitleStyle}>Select Language</h3>
        <div style={languageButtonsContainer}>
          {["python", "javascript", "java", "c++", "c#", "c", "go", "kotlin", "swift", "typescript", "r"].map((lang) => (
            <label key={lang} style={languageLabelStyle}>
              <input
                type="radio"
                name="language"
                value={lang}
                checked={selectedLanguage === lang}
                onChange={handleLanguageChange}
                style={radioStyle}
              />
              {lang.toUpperCase()}
            </label>
          ))}
        </div>
      </section>
      <section style={projectSectionStyle}>
        <h3 style={sectionTitleStyle}>Current Project</h3>
        {projects.length > 0 ? (
          <ProjectCard project={projects[currentProjectIndex]} />
        ) : (
          <p style={loadingStyle}>Loading projects...</p>
        )}
      </section>
      <section style={buttonsContainerStyle}>
        <button onClick={() => handleSwipe("left")} style={swipeButtonStyle}>
          👎 Left
        </button>
        <button onClick={() => handleSwipe("right")} style={swipeButtonStyle}>
          👍 Right
        </button>
      </section>
    </div>
  );
};

const containerStyle = {
  background: "linear-gradient(135deg, #ffffff, #f6f8fa)",
  minHeight: "100vh",
  padding: "40px",
  textAlign: "center",
  fontFamily: "'Montserrat', sans-serif",
};

const headerStyle = {
  marginBottom: "30px",
};

const titleStyle = {
  fontSize: "3rem",
  color: "#24292e", 
  textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
};

const sectionTitleStyle = {
  fontSize: "1.5rem",
  color: "#24292e",
  marginBottom: "15px",
};

const languageSectionStyle = {
  marginBottom: "40px",
};

const languageButtonsContainer = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "15px",
};

const languageLabelStyle = {
  background: "#fafbfc",
  padding: "8px 12px",
  borderRadius: "20px",
  boxShadow: "0 2px 4px rgba(27,31,35,0.12)",
  cursor: "pointer",
  fontSize: "14px",
  color: "#24292e",
};

const radioStyle = {
  marginRight: "5px",
};

const projectSectionStyle = {
  marginBottom: "40px",
};

const loadingStyle = {
  fontSize: "1rem",
  color: "#586069",
};

const buttonsContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "30px",
};

const swipeButtonStyle = {
  padding: "12px 24px",
  fontSize: "18px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#2ea44f", 
  color: "#fff",
  transition: "background-color 0.2s ease",
};

export default Home;
