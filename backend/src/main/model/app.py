from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pymysql
from dotenv import load_dotenv
from datetime import datetime
import time
from typing import Optional
import numpy as np
import requests
import random
import redis
import json
import os

# sets up FastAPI environment and loads .env
app = FastAPI()
load_dotenv()

# allows the frontend on :3000 to send requests back to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# connect to a local Redis instance
redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

GITHUB_API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv('GITHUB_PERSONAL_ACC_TOKEN')

LANGUAGE_KEYWORDS = {
    "python": ["python", "django", "flask", "jupyter-notebook", "numpy", "scikit-learn", "keras", "pytorch", "tensorflow", "pandas", "machine-learning"],
    "javascript": ["javascript", "node", "react", "next", "vue", "express", "js", "node.js", "react.js", "next.js", "next"],
    "java": ["java", "spring", "jvm", "junit4", "junit5", "minecraft", "spring-boot", "spring boot", "spring-security", "javafx"],
    "sql": ["sql", "postgres", "mysql", "sqlite", "supabase", "pgsql", "database", "db", "databases", "gui-sql", "relational"],
    "go": ["go", "golang"],
    "rust": ["rust"],
    "ruby": ["ruby", "rails"],
    "c++": ["c++", "cpp"],
    "c": ["c"],
    "typescript": ["typescript", "ts"],
    "swift": ["swift", "ios"],
    "kotlin": ["kotlin", "android"],
    "unknown": []
}

def check_db_conn():
    global db_conn
    try:
        db_conn.ping(reconnect=True)
    except:
        db_conn = pymysql.connect(
            host="localhost",
            user="root",
            password="",
            database="restaurantdb",
            charset="utf8mb4",
            cursorclass=pymysql.cursors.DictCursor
        )

# Pydantic model for a ResetRequest, used to indicate the user and the language to be wiped
class ResetRequest(BaseModel):
    user_id: int
    language: str

# reset the user's swipe history and wipe their Redis cache
@app.post("/reset/")
async def reset_model(reset: ResetRequest):
    # delete the swipes for this userid
    redis_client.delete(f"user:{reset.user_id}:swipes")
    # set the new language for the userid
    redis_client.set(f"user:{reset.user_id}:language", reset.language)
    return {"message": f"Model reset for language {reset.language}"}

# Project model
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

# SwipeRequest, defines a user Swipe
class SwipeRequest(BaseModel):
    user_id: int
    project: Project
    direction: str

# Appends a swipe to the Redis cache
@app.post("/swipe/")
async def record_swipe(swipe: SwipeRequest):
    if swipe.direction not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Invalid swipe direction")

    # Prevent duplicate swipes
    if redis_client.sismember(f"user:{swipe.user_id}:seen_urls", swipe.project.url):
        raise HTTPException(status_code=409, detail="Project already swiped")

    redis_client.sadd(f"user:{swipe.user_id}:seen_urls", swipe.project.url)

    curr_len = redis_client.llen(f"user:{swipe.user_id}:swipes")
    new_len = redis_client.rpush(
        f"user:{swipe.user_id}:swipes",
        json.dumps({"direction": swipe.direction, "project": swipe.project.dict()})
    )

    if curr_len == new_len:
        raise Exception("Swipe not recorded properly.")

    return {"message": "Swipe recorded"}

def fetch_projects_from_db(language: str, seen_urls: set, limit: int = 300):
    check_db_conn()
    cursor = db_conn.cursor()
    cursor.execute(
        "SELECT * FROM github_issues WHERE primary_language = %s ORDER BY updated_at DESC LIMIT %s",
        (language, limit)
    )
    rows = cursor.fetchall()
    cursor.close()

    projects = []
    for row in rows:
        if row["issue_url"] in seen_urls:
            continue
        projects.append({
            "title": row["title"],
            "url": row["issue_url"],
            "updatedAt": row["updated_at"].strftime("%Y-%m-%dT%H:%M:%SZ"),
            "bodyText": row["body"] or "",
            "labels": json.loads(row["labels"] or "[]"),
            "repo_name": row["repo_name"],
            "repo_url": row["repo_url"],
            "primaryLanguage": row["primary_language"],
            "stargazerCount": row["stargazer_count"],
            "description": "",
            "forkCount": row["fork_count"],
            "watchers": row["watchers"],
            "topics": json.loads(row["topics"] or "[]")
        })
    return projects

def train_model(user_id: int):
    print("training model...")
    raw_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)

    right_swipes = []
    for entry in raw_swipes:
        entry = entry.strip()
        if not entry.startswith("{"):
            continue
        try:
            obj = json.loads(entry)
        except:
            continue
        if obj.get("direction") == "right":
            right_swipes.append(obj["project"])
    if len(right_swipes) < 25:
        print(f"[ML] Not enough right‐swipes ({len(right_swipes)}) to train.")
        return [], 0

    records = []
    directions = []
    for entry in raw_swipes:
        entry = entry.strip()
        if not entry.startswith("{"):
            continue
        try:
            obj = json.loads(entry)
        except:
            continue
        proj = obj.get("project", {})
        dir_flag = obj.get("direction", "left")
        text = (
            f"{proj.get('title','')} {proj.get('primaryLanguage','')} "
            f"{proj.get('description','')} {' '.join(proj.get('labels', []))} "
            f"{' '.join(proj.get('topics', []))} {proj.get('stargazerCount', 0)} "
            f"{proj.get('forkCount', 0)} {proj.get('watchers', 0)}"
        )
        records.append(text)
        directions.append(1 if dir_flag == "right" else 0)

    vectorizer = TfidfVectorizer(stop_words="english", max_features=500)
    tfidf_matrix = vectorizer.fit_transform(records)

    liked_indices = [i for i, d in enumerate(directions) if d == 1]
    liked_mean = np.asarray(tfidf_matrix[liked_indices].mean(axis=0)).reshape(1, -1)

    lang = redis_client.get(f"user:{user_id}:language") or "python"
    seen = redis_client.smembers(f"user:{user_id}:seen_urls")
    candidates = fetch_projects_from_db(lang, seen_urls=set(seen), limit=1000)

    if not candidates:
        return [], 0

    candidate_texts = []
    star_counts = []
    for proj in candidates:
        txt = (
            f"{proj['title']} {proj['primaryLanguage']} "
            f"{proj['description']} {' '.join(proj['labels'])} "
            f"{' '.join(proj['topics'])} {proj['stargazerCount']} "
            f"{proj['forkCount']} {proj['watchers']}"
        )
        candidate_texts.append(txt)
        star_counts.append(proj["stargazerCount"])

    cand_tfidf = vectorizer.transform(candidate_texts)
    sim_scores = cosine_similarity(liked_mean, cand_tfidf).flatten()
    star_array = np.array(star_counts)
    max_star = star_array.max() if star_array.max() > 0 else 1
    adjusted = sim_scores * (1 + 0.6 * (star_array / max_star))

    # grab the top 10
    sorted_idx = adjusted.argsort()[::-1]
    top10 = [candidates[i] for i in sorted_idx[:10]]
    filtered_count = len(candidates) - len(top10)
    return top10, filtered_count

@app.get("/recommendations/")
async def get_recommendations(user_id: int):
    print(f"=== GET /recommendations/ CALLED FOR USER {user_id}")
    stored_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    seen_urls = set()
    for entry in stored_swipes:
        entry = entry.strip()
        if not entry.startswith("{"):
            continue
        try:
            obj = json.loads(entry)
            seen_urls.add(obj["project"].get("url", ""))
        except:
            continue

    #if we have at least 25 right‐swipes, train
    if len([e for e in stored_swipes if e.strip().startswith("{") and json.loads(e).get("direction") == "right"]) >= 25:
        recs, filtered_count = train_model(user_id)
        if recs:
            print("[recommendations] returning model‐trained results")
            return {"recommended_repos": recs, "filtered_count": filtered_count}
        else:
            print("[recommendations] not enough high‐quality model data, falling back…")

    language = redis_client.get(f"user:{user_id}:language") or "python"
    projects = fetch_projects_from_db(language, seen_urls=seen_urls, limit=300)
    if not projects:
        return {"message": "No projects found. Try swiping more!"}
    random.shuffle(projects)
    return {"recommended_repos": projects, "filtered_count": len(seen_urls)}

# debug stuff
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