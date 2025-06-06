from fastapi.responses import JSONResponse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from collections import Counter
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

GITHUB_API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv('GITHUB_PERSONAL_ACC_TOKEN')
REDIS_HOST=os.getenv("REDISHOST")
REDIS_PORT=os.getenv("REDISPORT")
MYSQL_HOST=os.getenv("MYSQLHOST")
MYSQL_USER=os.getenv("MYSQLUSER")
MYSQL_PASSWORD=os.getenv("MYSQLPASSWORD")
MYSQL_DATABASE=os.getenv("MYSQL_DATABASE")

# connect to a local Redis instance
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


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
    redis_client.delete(f"user:{reset.user_id}:swipes")
    redis_client.delete(f"user:{reset.user_id}:seen_urls")
    redis_client.delete(f"user:{reset.user_id}:right_swipe_count")
    redis_client.delete(f"user:{reset.user_id}:top_interest")
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

def extract_top_interest(swipes):
    topic_freq = {}
    for entry in swipes:
        try:
            obj = json.loads(entry)
            if obj.get("direction") == "right":
                project = obj["project"]
                topics = project.get("topics", [])
                labels = project.get("labels", [])
                for tag in topics + labels:
                    tag = tag.lower()
                    if tag not in LANGUAGE_KEYWORDS and tag not in ["enhancement", "good first issue", "help wanted", "bug", "documentation"] and len(tag) > 1:
                        topic_freq[tag] = topic_freq.get(tag, 0) + 1
        except:
            continue
    if not topic_freq:
        return ["N/A"]
    sorted_topics = sorted(topic_freq.items(), key=lambda x: x[1], reverse=True)
    print(sorted_topics)
    return [t[0] for t in sorted_topics[:3]]

@app.get("/exhaustion/")
async def get_exhaustion(user_id: int, language: str):
    normalized_lang = language.lower()
    exhausted = redis_client.get(f"user:{user_id}:exhausted:{normalized_lang}")
    return {"exhausted": exhausted == "true"}

# Appends a swipe to the Redis cache
@app.post("/swipe/")
async def swipe(payload: dict):
    user_id = payload.get("user_id")
    project = payload.get("project")
    direction = payload.get("direction")
    url = project.get("url")

    if not user_id or not project or not direction or not url:
        raise HTTPException(status_code=400, detail="Missing data")

    swipe_key = f"user:{user_id}:swipes"
    right_set = f"user:{user_id}:right_swiped_urls"
    seen_set = f"user:{user_id}:seen_urls"

    if redis_client.sismember(right_set, url):
        return JSONResponse(status_code=409, content={"message": "Already liked this project"})

    redis_client.sadd(seen_set, url)

    if direction == "right":
        redis_client.sadd(right_set, url)

        old_swipes = redis_client.lrange(swipe_key, 0, -1)
        cleaned = []
        for s in old_swipes:
            try:
                swipe_obj = json.loads(s)
                if swipe_obj["project"].get("url") != url:
                    cleaned.append(s)
            except:
                cleaned.append(s)
        redis_client.delete(swipe_key)
        for entry in cleaned:
            redis_client.rpush(swipe_key, entry)

        redis_client.rpush(swipe_key, json.dumps({
            "direction": direction,
            "project": project,
            "timestamp": time.time()
        }))

        print(f"[swipe] Removed any left-swipe for: {url}")

    elif direction == "left":
        already_left = False
        existing = redis_client.lrange(swipe_key, 0, -1)
        for s in existing:
            try:
                obj = json.loads(s)
                if obj["project"].get("url") == url and obj["direction"] == "left":
                    already_left = True
                    break
            except:
                continue

        if not already_left:
            redis_client.rpush(swipe_key, json.dumps({
                "direction": direction,
                "project": project,
                "timestamp": time.time()
            }))

    right_count = redis_client.scard(right_set)
    retrain_triggered = False
    if right_count % 25 == 0:
        train_model(user_id)
        retrain_triggered = True

    return {"message": "Swipe recorded", "model_trained": retrain_triggered}

def fetch_projects_from_db(language: str, seen_urls: set, limit: int = 300):
    check_db_conn()
    cursor = db_conn.cursor()
    cursor.execute(
    "SELECT * FROM github_issues WHERE LOWER(primary_language) = LOWER(%s) ORDER BY updated_at DESC LIMIT %s",
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
        return [], "N/A"

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
        print("[ML] No candidates to score — returning empty.")
        return [], "N/A"

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
    stored_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    sorted_idx = adjusted.argsort()[::-1]
    top10 = [candidates[i] for i in sorted_idx[:10]]
    topinterests = extract_top_interest(stored_swipes)
    redis_client.set(f"user:{user_id}:top_interest", json.dumps(topinterests)) 
    print("[ML] Returning trained recommendations!")

    return top10, topinterests

@app.get("/recommendations/")
async def get_recommendations(user_id: int, language: Optional[str] = None):
    print(f"=== GET /recommendations/ for user {user_id}, lang: {language}")
    
    if language:
        redis_client.set(f"user:{user_id}:language", language)
    stored_language = redis_client.get(f"user:{user_id}:language") or "python"
    print(stored_language)
    normalized_lang = stored_language.lower()

    seen_urls = redis_client.smembers(f"user:{user_id}:seen_urls")
    right_swiped_urls = redis_client.smembers(f"user:{user_id}:right_swiped_urls")
    all_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)

    right_swipes = [s for s in all_swipes if s.strip().startswith("{") and json.loads(s).get("direction") == "right"]
    top_interest = extract_top_interest(all_swipes)

    if len(right_swipes) >= 25:
        ml_recs, top_interest = train_model(user_id)
        if ml_recs:
            print("[ML] Returning model-trained results")
            redis_client.set(f"user:{user_id}:exhausted:{normalized_lang}", "false")
            return {"recommended_repos": ml_recs, "top_interest": top_interest}

    projects = fetch_projects_from_db(normalized_lang, seen_urls=set(seen_urls), limit=1000)
    fallback_candidates = [p for p in projects if p["url"] not in right_swiped_urls]

    if fallback_candidates:
        print(f"[fallback] Returning {len(fallback_candidates)} unseen projects")
        redis_client.set(f"user:{user_id}:exhausted:{normalized_lang}", "false")
        random.shuffle(fallback_candidates)
        return {"recommended_repos": fallback_candidates[:10], "top_interest": top_interest}

    left_swipes = []
    for s in all_swipes:
        if s.strip().startswith("{"):
            obj = json.loads(s)
            if obj.get("direction") == "left":
                proj = obj.get("project", {})
                if proj.get("primaryLanguage", "").lower() == normalized_lang:
                    if proj.get("url") not in right_swiped_urls:
                        left_swipes.append(proj)

    if left_swipes:
        print(f"[left-swipe fallback] Returning {len(left_swipes)} left-swiped")
        redis_client.set(f"user:{user_id}:exhausted:{normalized_lang}", "false")
        random.shuffle(left_swipes)
        return {"recommended_repos": left_swipes[:10], "top_interest": top_interest}

    print(f"[exhausted] Nothing left — setting exhausted:{normalized_lang}")
    redis_client.set(f"user:{user_id}:exhausted:{normalized_lang}", "true")
    return {
        "message": "You've swiped through everything for this language. Come back later!",
        "recommended_repos": [],
        "top_interest": top_interest
    }

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