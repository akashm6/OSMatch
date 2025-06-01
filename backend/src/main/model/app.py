from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
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
    
    print("Received swipe:", swipe)

    curr_len = redis_client.llen(f"user:{swipe.user_id}:swipes")

    new_len = redis_client.rpush(
        f"user:{swipe.user_id}:swipes",
        json.dumps({"direction": swipe.direction, "project": swipe.project.dict()})
    )

    # if we stay at the same length after pushing, something went wrong
    if(curr_len == new_len):
        raise Exception("Swipe didn't correctly append to cache.")
    
    print(f"Appended swipe for user {swipe.user_id}. Redis rpush result (list length):", new_len)
    
    # current debug, will remove later
    current_swipes = redis_client.lrange(f"user:{swipe.user_id}:swipes", 0, -1)
    print(f"Current swipe list for user {swipe.user_id}:", current_swipes)
    
    return {"message": "Swipe recorded"}

def is_recent(updated_at_str):
    try:
        updated_at = datetime.strptime(updated_at_str, "%Y-%m-%dT%H:%M:%SZ")
        return updated_at.year >= 2021
    except:
        return False

def infer_language(primary_lang, topics, labels, title):
    if primary_lang:
        return primary_lang.lower()
    combined = [*topics, *labels, title.lower()]
    for lang, keywords in LANGUAGE_KEYWORDS.items():
        for keyword in keywords:
            if any(keyword in item.lower() for item in combined):
                return lang
    return "unknown"

def get_graphql_query(language: str, number: int = 100, cursor: Optional[str] = None):
    after_clause = f', after: "{cursor}"' if cursor else ""
    return f"""
    {{
      search(query: "language:{language} state:open label:\\"help wanted\\" stars:>10 archived:false", type: ISSUE, first: {number}{after_clause}) {{
        pageInfo {{
          hasNextPage
          endCursor
        }}
        edges {{
          node {{
            ... on Issue {{
              title
              url
              updatedAt
              bodyText
              labels(first: 5) {{
                nodes {{ name }}
              }}
              repository {{
                name
                url
                description
                primaryLanguage {{ name }}
                stargazers {{ totalCount }}
                forkCount
                watchers {{ totalCount }}
                repositoryTopics(first: 5) {{
                  nodes {{ topic {{ name }} }}
                }}
              }}
            }}
          }}
        }}
      }}
    }}
    """

def parse_project(node):
    updatedAt = node.get("updatedAt", "")
    if not is_recent(updatedAt):
        return None
    title = node.get("title", "")
    url = node.get("url", "")
    bodyText = node.get("bodyText", "")
    label_nodes = node.get("labels", {}).get("nodes", [])
    labels = [label.get("name", "") for label in label_nodes]
    repo = node.get("repository", {})
    repo_name = repo.get("name", "")
    repo_url = repo.get("url", "")
    stargazerCount = repo.get("stargazers", {}).get("totalCount", 0)
    description = repo.get("description", "")
    forkCount = repo.get("forkCount", 0)
    watchers = repo.get("watchers", {}).get("totalCount", 0)
    topic_nodes = repo.get("repositoryTopics", {}).get("nodes", [])
    topics = [t.get("topic", {}).get("name", "") for t in topic_nodes]
    primaryLanguage = repo.get("primaryLanguage", {}).get("name", "")
    primaryLanguage = infer_language(primaryLanguage, topics, labels, title)
    return {
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

def fetch_default_projects(language: str, initial: bool = True, seen_urls: set = None):
    projects = []
    seen_urls = seen_urls or set()
    cursor = None
    attempts = 3 if initial else 5
    while attempts > 0:
        query = get_graphql_query(language, number=30, cursor=cursor)
        headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
        response = requests.post(GITHUB_API_URL, json={"query": query}, headers=headers)
        if response.status_code != 200:
            print("GitHub API error:", response.text)
            break
        data = response.json().get("data", {}).get("search", {})
        edges = data.get("edges", [])
        for edge in edges:
            proj = parse_project(edge.get("node", {}))
            if proj and proj["url"] not in seen_urls:
                projects.append(proj)
                seen_urls.add(proj["url"])
        if not data.get("pageInfo", {}).get("hasNextPage"):
            break
        cursor = data.get("pageInfo", {}).get("endCursor")
        attempts -= 1
    return projects


def train_model(user_id):
    swipe_data = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    print(f"[ML] Total swipes: {len(swipe_data)}")
    
    if len(swipe_data) < 25:
        print("[ML] Not enough data to train — need at least 25 swipes")
        return []
    
    records, directions = [], []
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
                f"{' '.join(project.get('topics', []) )} "
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
    print("[ML] TF-IDF matrix shape:", tfidf_matrix.shape)

    liked_indices = [i for i, d in enumerate(directions) if d == 1]
    print("[ML] Liked indices:", liked_indices)
    if not liked_indices:
        print("[ML] No liked swipes found.")
        return []

    liked_mean = tfidf_matrix[liked_indices].mean(axis=0)
    liked_mean = np.asarray(liked_mean).reshape(1, -1)  # ✅ Fix for np.matrix warning

    candidate_projects = fetch_default_projects(redis_client.get(f"user:{user_id}:language") or "r", initial=False)
    
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
        print("[ML] No new candidates after filtering. Falling back.")
        candidate_projects_filtered = candidate_projects
    else:
        print("CANDIDATE PROJECTS AFTER FILTERING: ", candidate_projects_filtered)
        
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

    print("[ML] Top similarity score:", candidate_similarity.max())
    print("[ML] Nonzero similarities:", np.count_nonzero(candidate_similarity))

    star_counts = np.array([proj.get("stargazerCount", 0) for proj in candidate_projects_filtered])
    max_star = star_counts.max() if star_counts.max() > 0 else 1
    alpha = 0.6
    adjusted_similarity = candidate_similarity.copy()

    for i in range(candidate_similarity.shape[1]):
        norm_star = star_counts[i] / max_star
        adjusted_similarity[0, i] = candidate_similarity[0, i] * (1 + alpha * norm_star)

    sorted_indices = adjusted_similarity.argsort()[0][::-1]
    print("[ML] Top 5 scores:", adjusted_similarity[0][sorted_indices[:5]])
    print("[ML] Top 5 URLs:", [candidate_projects_filtered[i]["url"] for i in sorted_indices[:5]])

    recommendations = [candidate_projects_filtered[i] for i in sorted_indices][:10]
    return recommendations
    
# grabs new recommended projects
@app.get("/recommendations/")
async def get_recommendations(user_id: int):
    language = redis_client.get(f"user:{user_id}:language") or "r"
    
    stored_swipes = redis_client.lrange(f"user:{user_id}:swipes", 0, -1)
    # in the event of a language change or initial bootup
    if len(stored_swipes) < 10:
        default_projects = fetch_default_projects(language, initial = True)
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
    # otherwise, we can train the model
    recommendations = train_model(user_id)
    if not recommendations:
        return {"message": "Not enough data, swipe more to get recommendations!"}
    
    return {"recommended_repos": recommendations}

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
