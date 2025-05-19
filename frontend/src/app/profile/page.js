"use client";
import { useState, React, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupProfile() {

    const [userId, setuserId] = useState(0);
    const [currentBio, setCurrentBio] = useState('');

    // ensure that this occurs outside of SSR 
    useEffect(() => {
        const currentBio = localStorage.getItem("bio");
        const userId = localStorage.getItem("userId");
        if(currentBio) {
            setCurrentBio(currentBio);
        }
        if(userId) {
            setuserId(userId);
        }
       
    }, []);
    
    const [likedProjects, setLikedProjects] = useState([]);
    // used for popup when editing profile
    const [ShowPopup, setShowPopup] = useState(false);
    const [BioInput, setBioInput] = useState('');


    const router = useRouter();

    // sends post to backend to update bio in DB
    const handleBioChange = async (e) => {
       try {
        const payload = {
            userId: userId,
            bio: BioInput,
        };

        const res = await fetch(`http://localhost:8080/profile/edit`, {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if(res.ok) {
            setShowPopup(false);
            setCurrentBio(BioInput);
            localStorage.setItem("bio", BioInput);
        }

        else {
            console.log("Failed to update bio.");
        }

        const data = await res.text();
        console.log(data);
       }

       catch(err) {
        console.error(err);
       }

    };

    // grabs a user's liked projects from the DB
    const grabLikedProjects = async () => {
        try {
            console.log(userId);
            const res = await fetch(`http://localhost:8080/profile/likedProjects?userId=${userId}`);
            const data = await res.json();
            setLikedProjects(data);
        }

        catch(error) {
            console.log(error);
        };
        };
        
        useEffect(() => {
            if(userId) {
                grabLikedProjects(userId);
            }
        }, [userId])
        
        console.log(likedProjects);


        return (
            <div>
                <h1> this is the profile page.</h1>
                <h2>This is my bio!: {currentBio}</h2>
                <button onClick={() => setShowPopup(true)}>Edit Profile</button>

                {ShowPopup && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContentStyle}>
                        <h2>Edit Bio</h2>
                        <textarea
                            value={BioInput}
                            onChange={(e) => setBioInput(e.target.value)}
                            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
                        />
                        <div>
                            <button onClick={handleBioChange}>Save</button>
                            <button onClick={() => setShowPopup(false)}>Cancel</button>
                        </div>
                        </div>
                    </div>
                )}

            </div>
        );
}

// will move to a css file later
const modalOverlayStyle = {
    position: "fixed",
    top: 0, left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  };
  
  const modalContentStyle = {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    maxWidth: "90%"
  };