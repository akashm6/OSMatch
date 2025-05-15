from fastapi import FastAPI, HTTPException
import redis
import json
import requests
import random
import numpy as np
from typing import Optional

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

GITHUB_API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv('GITHUB_PERSONAL_ACC_TOKEN')

def get_graphql_query(language: str):
    query = f"""
    {{
      search(query: "language:{language} state:open label:\\"help wanted\\"", type: ISSUE, first: 10) {{
        edges {{
          node {{
            ... on Issue {{
              title
              url
              updatedAt
              bodyText
              labels(first: 5) {{
                nodes {{
                  name
                }}
              }}
              repository {{
                name
                url
                description
                primaryLanguage {{
                  name
                }}
                stargazers {{
                  totalCount
                }}
                forkCount
                watchers {{
                  totalCount
                }}
                repositoryTopics(first: 5) {{
                  nodes {{
                    topic {{
                      name
                    }}
                  }}
                }}
              }}
            }}
          }}
        }}
      }}
    }}
    """
    return query

class ResetRequest(BaseModel):
    user_id: int
    language: str

@app.post("/reset/")
async def reset_model(reset: ResetRequest):
    redis_client.delete(f"user:{reset.user_id}:swipes")
    redis_client.set(f"user:{reset.user_id}:language", reset.language)
    return {"message": f"Model reset for language {reset.language}"}

class Project(BaseModel):
    title: str
    url: str
    updatedAt: str
    bodyText: Optional[str] = ""
    labels: list[str]
    repo_name: str
    repo_url: str
    primaryLanguage: str
    stargazerCount: int
    description: Optional[str] = ""
    forkCount: Optional[int] = 0
    watchers: Optional[int] = 0
    topics: list[str]

class SwipeRequest(BaseModel):
    user_id: int
    project: Project
    direction: str

@app.post("/swipe/")
async def record_swipe(swipe: SwipeRequest):
    if swipe.direction not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Invalid swipe direction")
    
    print("Received swipe:", swipe)
    
    result = redis_client.rpush(
        f"user:{swipe.user_id}:swipes",
        json.dumps({"direction": swipe.direction, "project": swipe.project.dict()})
    )
    print(f"Appended swipe for user {swipe.user_id}. Redis rpush result (list length):", result)
    
    current_swipes = redis_client.lrange(f"user:{swipe.user_id}:swipes", 0, -1)
    print(f"Current swipe list for user {swipe.user_id}:", current_swipes)
    
    return {"message": "Swipe recorded"}

def fetch_default_projects(language: str):
    query = get_graphql_query(language)
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.post(GITHUB_API_URL, json={"query": query}, headers=headers)
    if response.status_code != 200:
        print("Error fetching projects from GitHub:", response.text)
        return []
    data = response.json()
    projects = []
    try:
        edges = data.get("data", {}).get("search", {}).get("edges", [])
        for edge in edges:
            node = edge.get("node", {})
            title = node.get("title", "")
            url = node.get("url", "")
            updatedAt = node.get("updatedAt", "")
            bodyText = node.get("bodyText", "")
            label_nodes = node.get("labels", {}).get("nodes", [])
            labels = [label.get("name", "") for label in label_nodes]
            repo = node.get("repository", {})
            repo_name = repo.get("name", "")
            repo_url = repo.get("url", "")
            primaryLanguage = repo.get("primaryLanguage", {}).get("name", "")
            stargazerCount = repo.get("stargazers", {}).get("totalCount", 0)
            description = repo.get("description", "")
            forkCount = repo.get("forkCount", 0)
            watchers = repo.get("watchers", {}).get("totalCount", 0)
            topic_nodes = repo.get("repositoryTopics", {}).get("nodes", [])
            topics = [t.get("topic", {}).get("name", "") for t in topic_nodes]
            project = {
                "title": title,
                "url": url,
                "updatedAt": updatedAt,
                "bodyText": bodyText,
                "labels": labels,
                "repo_name": repo_name,
                "repo_url": repo_url,
                "primaryLanguage": primaryLanguage,
                "stargazerCount": stargazerCount,
                "description": description,
                "forkCount": forkCount,
                "watchers": watchers,
                "topics": topics
            }
            projects.append(project)
    except Exception as e:
        print("Error processing GitHub data:", e)
    return projects

def train_model(user_id):
    swipe_data = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    print("Swipe list for user", user_id, ":", swipe_data)
    
    if len(swipe_data) < 10:
        print("Not enough swipe data for ML training.")
        return []
    
    records = []
    directions = []
    for val in swipe_data:
        if not val.strip().startswith("{"):
            continue
        try:
            data = json.loads(val)
            project = data.get("project", {})
            direction = data.get("direction", "left")
            text = (
                f"{project.get('title', '')} "
                f"{project.get('primaryLanguage', '')} "
                f"{project.get('description', '')} "
                f"{' '.join(project.get('labels', []))} "
                f"{' '.join(project.get('topics', []))} "
                f"{project.get('stargazerCount', 0)} "
                f"{project.get('forkCount', 0)} "
                f"{project.get('watchers', 0)}"
            )
            records.append(text)
            directions.append(1 if direction == "right" else 0)
        except Exception as e:
            print("Error parsing swipe data for ML:", e)
    
    if not records:
        return []
    
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(records)
    print("TF-IDF matrix shape:", tfidf_matrix.shape)
    
    liked_indices = [i for i, d in enumerate(directions) if d == 1]
    print("Liked indices:", liked_indices)
    if not liked_indices:
        print("No liked swipes found.")
        return []
    
    liked_mean = tfidf_matrix[liked_indices].mean(axis=0)
    liked_mean = np.asarray(liked_mean)
    
    candidate_projects = fetch_default_projects(redis_client.get(f"user:{user_id}:language") or "r")
    stored_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    swiped_urls = set()
    for val in stored_swipes:
        if not val.strip().startswith("{"):
            continue
        try:
            swipe_info = json.loads(val)
            if "project" in swipe_info:
                swiped_urls.add(swipe_info["project"].get("url", ""))
        except Exception as e:
            print("Error parsing swipe data for filtering:", e)
    
    candidate_projects_filtered = [proj for proj in candidate_projects if proj["url"] not in swiped_urls]
    if not candidate_projects_filtered:
        print("No new candidate projects available after filtering. Falling back to default projects.")
        candidate_projects_filtered = candidate_projects
    
    candidate_texts = []
    for proj in candidate_projects_filtered:
        text = (
            f"{proj.get('title', '')} "
            f"{proj.get('primaryLanguage', '')} "
            f"{proj.get('description', '')} "
            f"{' '.join(proj.get('labels', []))} "
            f"{' '.join(proj.get('topics', []))} "
            f"{proj.get('stargazerCount', 0)} "
            f"{proj.get('forkCount', 0)} "
            f"{proj.get('watchers', 0)}"
        )
        candidate_texts.append(text)
    
    candidate_tfidf = vectorizer.transform(candidate_texts)
    candidate_similarity = cosine_similarity(liked_mean, candidate_tfidf)
    
    star_counts = np.array([proj.get("stargazerCount", 0) for proj in candidate_projects_filtered])
    max_star = star_counts.max() if star_counts.max() > 0 else 1
    alpha = 0.5
    adjusted_similarity = candidate_similarity.copy()
    for i in range(candidate_similarity.shape[1]):
        norm_star = star_counts[i] / max_star
        adjusted_similarity[0, i] = candidate_similarity[0, i] * (1 + alpha * norm_star)
    
    sorted_indices = adjusted_similarity.argsort()[0][::-1]
    recommendations = [candidate_projects_filtered[i] for i in sorted_indices][:10]
    print("ML-based recommendations:", recommendations)
    return recommendations

@app.get("/recommendations/")
async def get_recommendations(user_id: int):
    language = redis_client.get(f"user:{user_id}:language") or "r"
    print("Using language:", language)
    print("GraphQL Query:", get_graphql_query(language))
    
    stored_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    if len(stored_swipes) < 10:
        default_projects = fetch_default_projects(language)
        if not default_projects:
            return {"message": "No projects found. Try swiping more!"}
        swiped_urls = set()
        for val in stored_swipes:
            if not val.strip().startswith("{"):
                continue
            try:
                swipe_info = json.loads(val)
                if "project" in swipe_info:
                    swiped_urls.add(swipe_info["project"].get("url", ""))
            except Exception as e:
                print("Error parsing swipe data during fallback filtering:", e)
        filtered_projects = [proj for proj in default_projects if proj["url"] not in swiped_urls]
        random.shuffle(filtered_projects)
        print("Fallback recommendations:", filtered_projects if filtered_projects else default_projects)
        return {"recommended_repos": filtered_projects if filtered_projects else default_projects}
    
    recommendations = train_model(user_id)
    if not recommendations:
        return {"message": "Not enough data, swipe more to get recommendations!"}
    
    return {"recommended_repos": recommendations}

@app.get("/debug/swipes/")
async def debug_swipes(user_id: int):
    swipe_data = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    return {"swipe_data": swipe_data}

@app.get("/debug/model/")
async def debug_model(user_id: int):
    swipe_data = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    if not swipe_data:
        return {"message": "No swipe data available."}
    
    records = []
    directions = []
    for val in swipe_data:
        if not val.strip().startswith("{"):
            continue
        try:
            data = json.loads(val)
            project = data.get("project", {})
            direction = data.get("direction", "left")
            text = (
                f"{project.get('title', '')} "
                f"{project.get('primaryLanguage', '')} "
                f"{' '.join(project.get('labels', []))} "
                f"{' '.join(project.get('topics', []))} "
                f"{project.get('stargazerCount', 0)}"
            )
            records.append(text)
            directions.append(1 if direction == "right" else 0)
        except Exception as e:
            print("Error parsing swipe data in debug:", e)
    if not records:
        return {"message": "No swipe records."}
    
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(records)
    liked_indices = [i for i, d in enumerate(directions) if d == 1]
    if not liked_indices:
        return {"message": "No liked swipes yet."}
    liked_mean = np.asarray(tfidf_matrix[liked_indices].mean(axis=0))
    similarity_scores = cosine_similarity(liked_mean, tfidf_matrix)
    debug_data = {
        "tfidf_matrix_shape": tfidf_matrix.shape,
        "liked_indices": liked_indices,
        "similarity_scores": similarity_scores.flatten().tolist()
    }
    return {"model_debug": debug_data}
