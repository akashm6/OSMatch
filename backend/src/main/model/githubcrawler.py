import requests
import pymysql
import os
import json
import time
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GITHUB_API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv("GITHUB_PERSONAL_ACC_TOKEN")
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

conn = pymysql.connect(
    host="localhost",
    port=3306,
    user="root",
    password='',
    charset='utf8mb4',
    database="restaurantdb",
    cursorclass=pymysql.cursors.DictCursor
)

def get_query(language, cursor=None):
    after = f', after: "{cursor}"' if cursor else ""
    return f"""
    {{
      search(query: "language:{language} label:\\"good first issue\\" state:open archived:false", type: ISSUE, first: 50{after}) {{
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
    desc = repo.get("description", "")
    body = issue.get("bodyText", "")

    try:
        print("ISSUE URL:", issue["url"])
        cursor.execute(
            """
            INSERT INTO github_issues (
              issue_url,
              title,
              body,
              repo_name,
              repo_url,
              primary_language,
              description,
              stargazer_count,
              fork_count,
              watchers,
              labels,
              topics,
              updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)
            """,
            (
                issue["url"],                                   
                issue["title"],                             
                body,                                       
                repo.get("name", ""),                            
                repo.get("url", ""),                            
                repo.get("primaryLanguage", {}).get("name", "unknown").lower(),
                desc,                                              
                repo.get("stargazers", {}).get("totalCount", 0),  
                repo.get("forkCount", 0),                         
                repo.get("watchers", {}).get("totalCount", 0),  
                json.dumps([l["name"] for l in issue["labels"]["nodes"]]),
                json.dumps([t["topic"]["name"] for t in repo["repositoryTopics"]["nodes"]]),
                updated_at                                            
            )
        )
        if cursor.rowcount == 1:
            print(f"Inserted: {issue['title'][:80]}")
        else:
            print(f"Updated: {issue['title'][:80]}")
    except Exception as e:
        print("Error inserting issue:", e)
        print("Offending issue data:", json.dumps(issue, indent=2))


def crawl_issues(language):
    print(f"\nCrawling issues for: {language}")
    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}"}
    end_cursor = None
    inserted = 0

    try:
        cursor = conn.cursor()
        while True:
            query = get_query(language, end_cursor)
            try:
                response = requests.post(GITHUB_API_URL, json={"query": query}, headers=headers)
                try:
                    data = response.json()
                except Exception as e:
                    print("Failed to parse JSON:", e)
                    print("Raw response content:\n", response.text)
                    time.sleep(60) 
                    continue

                if "errors" in data:
                    print("GraphQL errors:")
                    for err in data["errors"]:
                        print("-", err)
                    time.sleep(60)
                    continue

                if "data" not in data or "search" not in data["data"]:
                    print("Missing 'data' or 'search' in response. Raw response:")
                    print(json.dumps(data, indent=2))
                    print("sleeping for 60s...")
                    time.sleep(60)
                    continue

                edges = data["data"]["search"].get("edges", [])
                if not edges:
                    print("No edges found.")
                    break

                for edge in edges:
                    node = edge.get("node", {})
                    if not node:
                        print("Skipping malformed issue:", node)
                        continue
                    try:
                        insert_issue(cursor, node)
                        inserted += 1
                    except Exception as e:
                        print("Error inserting issue:", e)
                        print("Offending issue data:")
                        print(json.dumps(node, indent=2))

                conn.commit()

                page_info = data["data"]["search"].get("pageInfo")
                if not page_info or not page_info.get("hasNextPage"):
                    break

                end_cursor = page_info["endCursor"]
                time.sleep(1) 

            except requests.exceptions.RequestException as e:
                print("Network error:", e)
                time.sleep(60)
                continue

    finally:
        cursor.close()
        print(f"Finished {language}: {inserted} issues inserted")


if __name__ == "__main__":
    try:
        for lang in ["c++"]:
            crawl_issues(lang)
    finally:
        conn.close()
