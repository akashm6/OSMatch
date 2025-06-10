from datetime import datetime, timedelta, date
from dotenv import load_dotenv
import requests
import pymysql
import json
import time
import os

load_dotenv()

GITHUB_API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv('GITHUB_PERSONAL_ACC_TOKEN')
REDIS_HOST=os.getenv("REDISHOST")
REDIS_PORT=os.getenv("REDISPORT")
REDISPASSWORD=os.getenv("REDISPASSWORD")
MYSQL_HOST=os.getenv("MYSQLHOST")
MYSQL_USER=os.getenv("MYSQLUSER")
MYSQL_PASSWORD=os.getenv("MYSQLPASSWORD")
MYSQL_DATABASE=os.getenv("MYSQL_DATABASE")
MYSQLPORT = os.getenv("MYSQLPORT")
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

conn = pymysql.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE,
    charset="utf8mb4",
    port=int(MYSQLPORT),
    cursorclass=pymysql.cursors.DictCursor
)

def get_date_ranges():
    start_date = date(2020, 1, 1)
    end_date = date.today()
    delta = timedelta(days=90)
    ranges = []

    current = start_date
    while current < end_date:
        next_date = min(current + delta, end_date)
        ranges.append(f"{current}..{next_date}")
        current = next_date
    return ranges

def get_query(language, date_range, cursor=None):
    after = f', after: "{cursor}"' if cursor else ""
    return f"""
    {{
      search(query: "language:{language} label:\\"good first issue\\" state:open archived:false created:{date_range}", type: ISSUE, first: 50{after}) {{
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
              labels(first: 5) {{ nodes {{ name }} }}
              repository {{
                name
                url
                primaryLanguage {{ name }}
                description
                stargazers {{ totalCount }}
                forkCount
                watchers {{ totalCount }}
                repositoryTopics(first: 5) {{ nodes {{ topic {{ name }} }} }}
              }}
            }}
          }}
        }}
      }}
    }}
    """

def insert_issue(cursor, issue):
    updated_at = issue.get("updatedAt")
    if updated_at:
        updated_at = datetime.strptime(updated_at, "%Y-%m-%dT%H:%M:%SZ")

    repo = issue.get("repository", {})
    try:
        cursor.execute(
            """
            INSERT INTO github_issues (
              issue_url, title, body, repo_name, repo_url, primary_language,
              description, stargazer_count, fork_count, watchers, labels, topics, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
            """,
            (
                issue["url"],
                issue["title"],
                issue.get("bodyText", ""),
                repo.get("name", ""),
                repo.get("url", ""),
                repo.get("primaryLanguage", {}).get("name", "unknown").lower(),
                repo.get("description", ""),
                repo.get("stargazers", {}).get("totalCount", 0),
                repo.get("forkCount", 0),
                repo.get("watchers", {}).get("totalCount", 0),
                json.dumps([l["name"] for l in issue["labels"]["nodes"]]),
                json.dumps([t["topic"]["name"] for t in repo["repositoryTopics"]["nodes"]]),
                updated_at
            )
        )
        print(f"{'Inserted' if cursor.rowcount == 1 else 'Updated'}: {issue['title'][:80]}")
    except Exception as e:
        print("Insert error:", e)
        print(json.dumps(issue, indent=2))

def crawl_issues(language):
    print(f"\nCrawling issues for: {language}")
    cursor = conn.cursor()
    inserted = 0
    date_ranges = get_date_ranges()

    try:
        for date_range in date_ranges:
            print("30s sleep between date ranges...")
            time.sleep(30)
            print(f"Date range: {date_range}")
            end_cursor = None

            while True:
                query = get_query(language, date_range, end_cursor)
                response = requests.post(GITHUB_API_URL, json={"query": query}, headers=HEADERS)

                try:
                    data = response.json()
                except Exception as e:
                    print("JSON parse error:", e)
                    print("Raw response:", response.text)
                    time.sleep(60)
                    continue

                if "errors" in data:
                    print("GraphQL errors:", data["errors"])
                    time.sleep(60)
                    break

                edges = data.get("data", {}).get("search", {}).get("edges", [])
                if not edges:
                    print("No more issues in this date range.")
                    break

                for edge in edges:
                    node = edge.get("node")
                    if node:
                        insert_issue(cursor, node)
                        inserted += 1

                conn.commit()

                page_info = data["data"]["search"].get("pageInfo", {})
                if not page_info.get("hasNextPage"):
                    break
                end_cursor = page_info["endCursor"]
                time.sleep(1)
    finally:
        cursor.close()
        print(f"Done with {language}: {inserted} issues inserted.")

if __name__ == "__main__":
    LANGUAGES = [
        "Python", "Java", "Javascript", "C++", "C#", "Go", "Rust", "C", "Swift", "Kotlin", "Ruby", "R", "PHP", "Dart",
        "Scala", "Lua", "Shell", "Perl"
    ]
    MAX_RETRIES = 3

    try:
        for lang in LANGUAGES:
            print(f"\n=== Starting crawl for {lang} ===")
            success = False
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    crawl_issues(lang)
                    success = True
                    break
                except Exception as e:
                    print(f"[{lang}] Attempt {attempt} failed: {e}")
                    print("backing off for some time...")
                    time.sleep(60 * attempt)  
            if not success:
                print(f"[{lang}] FAILED after {MAX_RETRIES} attempts. Skipping...")
            print("small break between langs...")
            time.sleep(10)  
    finally:
        conn.close()
