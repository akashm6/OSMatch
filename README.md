# OSMatch  

**OSMatch** is an AI-powered recommendation platform that connects developers with **open-source GitHub projects** aligned to their interests and skills. It leverages **machine learning**, **GitHub GraphQL APIs**, and **real-time swiping mechanics** to help engineers discover meaningful contributions faster.  

**Live App:** [osmatch.app](https://osmatch.vercel.app/)  

## Features  

- **Swipe-Based Discovery**: Tinder-style interface for swiping right on interesting projects and left on irrelevant ones.  
- **Machine Learning Recommendations**: TF-IDF + cosine similarity model learns from swipe history and suggests better matches over time.  
- **GitHub Integration**: Fetches live issues and project metadata using GitHub’s GraphQL API.  
- **Right-Swipe Memory**: Tracks liked projects and ensures they never reappear.  
- **Smart Filtering**: Filters out duplicates and already-seen projects across both ML-driven and fallback recommendation paths.  
- **Language-Aware Matching**: Supports language-specific queues to keep recommendations relevant.  
- **Exhaustion Handling**: Detects when all viable issues are swiped and shows a “come back later” state until new issues are crawled.  
- **Clean Frontend**: Next.js + shadcn/ui + Framer Motion for a sleek and responsive user experience.  
- **GitHub OAuth**: Login with GitHub to personalize swipes and tie them to your account.  

## Tech Stack  

- **Backend**: Spring Boot (auth, profiles, swipes), FastAPI (ML recommender), Scikit-learn, MySQL, Redis  
- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Framer Motion  
- **Data/ML**: TF-IDF, Cosine Similarity, GitHub GraphQL API  

## 🏗️ Architecture  
