import requests
import openai
from openai import OpenAI, RateLimitError, APIError, APIConnectionError
import time
import praw
import os
import json
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models.models import Lead, Job
from database.database import get_db
from typing import List, Dict
from datetime import datetime
from fastapi import BackgroundTasks

# Load environment variables
load_dotenv()

# Configuration
USE_LOCAL_MODEL = os.getenv('USE_LOCAL_MODEL', 'true').lower() == 'true'
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3:latest')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'candidate-sourcer-bot/0.1')
PHANTOMBUSTER_API_KEY = os.getenv("PHANTOMBUSTER_API_KEY")
PHANTOMBUSTER_PHANTOM_ID = os.getenv("PHANTOMBUSTER_PHANTOM_ID")

# Initialize Reddit client
try:
    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT
    )
except Exception as e:
    print(f"⚠️ Warning: Failed to initialize Reddit client: {str(e)}")
    reddit = None

# Initialize OpenAI client if needed
openai_client = None
if not USE_LOCAL_MODEL and OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"⚠️ Warning: Failed to initialize OpenAI client: {str(e)}")

def check_ollama_status():
    """Check if Ollama server is running and model is available."""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get('models', [])
            for model in models:
                if model.get('name') == OLLAMA_MODEL:
                    return True
            print(f"⚠️ Model {OLLAMA_MODEL} not found. Available models: {[m.get('name') for m in models]}")
            return False
    except requests.exceptions.ConnectionError:
        print("⚠️ Ollama server is not running. Please start it with 'ollama serve'")
        return False
    except Exception as e:
        print(f"⚠️ Error checking Ollama status: {str(e)}")
        return False
    return False

def call_ollama(prompt: str, model: str = OLLAMA_MODEL) -> str:
    """Make an API call to local Ollama instance."""
    if not check_ollama_status():
        print("⚠️ Falling back to OpenAI (if configured)")
        return ""
        
    try:
        print(f"🚀 Calling Ollama with model: {model}")
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        response.raise_for_status()
        result = response.json().get('response', '').strip()
        print(f"✅ Ollama response received, length: {len(result)} chars")
        return result
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Ollama API error: {str(e)}")
        return ""

def safe_gpt_call(prompt: str, max_retries=3, delay=5):
    """Make a model API call with retry logic and error handling."""
    if USE_LOCAL_MODEL:
        # Use Ollama for local model inference
        for attempt in range(max_retries):
            try:
                return call_ollama(prompt)
            except Exception as e:
                print(f"⚠️ Local model error (Attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
        return ""
    else:
        # Use OpenAI
        if not openai_client:
            print("⚠️ OpenAI client not initialized")
            return ""
            
        for attempt in range(max_retries):
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=300
                )
                return response.choices[0].message.content.strip()
            except RateLimitError:
                print(f"🔁 Rate limit hit. Retrying in {delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
            except APIConnectionError:
                print(f"🔌 Connection error. Retrying in {delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
            except APIError as e:
                print(f"⚠️ OpenAI API error: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
                continue
            except Exception as e:
                print(f"⚠️ Unexpected error in GPT call: {str(e)}")
                break
        return ""

def predict_subreddits(job_title: str, skills: List[str], location: str) -> List[str]:
    """Predict relevant subreddits for a job based on title, skills, and location."""
    print("\n🔍 Predicting subreddits...")
    prompt = f"""
You are a helpful assistant that suggests relevant subreddits for job searching. I need exactly 5 subreddits for this position:

Job Title: {job_title}
Required Skills: {', '.join(skills)}
Location: {location}

IMPORTANT: Format your response EXACTLY like this, one subreddit per line, starting with r/:
r/subreddit1
r/subreddit2
r/subreddit3
r/subreddit4
r/subreddit5

DO NOT include any other text, bullets, or formatting. ONLY return the subreddit names, one per line, starting with r/.
"""
    print(f"📝 Using prompt:\n{prompt}")
    text = safe_gpt_call(prompt, max_retries=3, delay=5)
    print(f"🤖 Model response:\n{text}")
    
    if not text:
        print("⚠️ Failed to predict subreddits - no response from model")
        return []
    
    # Extract subreddits from both r/ format and bullet points with r/
    subreddits = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith('r/'):
            subreddits.append(line)
        elif '*' in line and 'r/' in line:
            # Extract r/subreddit from bullet point format
            start = line.find('r/')
            end = line.find(':', start) if ':' in line[start:] else len(line)
            subreddit = line[start:end].strip()
            if subreddit:
                subreddits.append(subreddit)
    
    print(f"📋 Extracted subreddits: {subreddits}")
    
    # If no subreddits found, provide some default ones based on job title
    if not subreddits:
        defaults = [
            'r/forhire',
            'r/jobsearch',
            'r/recruitinghell',
            'r/jobs',
            'r/hiring'
        ]
        print(f"⚠️ No subreddits extracted, using defaults: {defaults}")
        return defaults
        
    return subreddits

def extract_contact_info(text: str) -> Dict:
    """Extract email and other contact information from text."""
    prompt = f"""
Analyze the following text and extract:
1. Email address (if present)
2. Other contact methods (LinkedIn, GitHub, portfolio URLs)
3. If no email is found, return "Not provided"

Text:
\"\"\"{text}\"\"\"

Return in this format:
Email: extracted_email@example.com
Contact: other contact methods
"""
    output = safe_gpt_call(prompt, max_retries=3, delay=5)
    if not output:
        return {"email": "Not provided", "contact_info": ""}
    
    # Parse the output
    email_line = [line for line in output.splitlines() if line.startswith('Email:')]
    contact_line = [line for line in output.splitlines() if line.startswith('Contact:')]
    
    email = email_line[0].replace('Email:', '').strip() if email_line else "Not provided"
    contact_info = contact_line[0].replace('Contact:', '').strip() if contact_line else ""
    
    return {
        "email": email,
        "contact_info": contact_info
    }

def scrape_subreddit_posts(subreddit: str, keywords: List[str], limit: int = 5) -> List[Dict]:
    """Scrape recent posts from a subreddit using multiple keywords."""
    try:
        # Get subreddit instance
        sub = reddit.subreddit(subreddit.replace('r/', ''))
        search_query = ' OR '.join(['open to work'] + keywords)
        
        results = []
        # Search in both titles and post content
        for post in sub.search(search_query, limit=limit, sort='new'):
            # Try to get author's profile description
            author_description = ""
            try:
                if post.author:
                    author = reddit.redditor(str(post.author))
                    if hasattr(author, 'description'):
                        author_description = author.description or ""
            except Exception as e:
                print(f"⚠️ Could not fetch author details: {str(e)}")

            # Combine post content with author description for better contact info extraction
            full_content = f"{post.title}\n{post.selftext}\n{author_description}"
            
            results.append({
                'title': post.title,
                'author': str(post.author),
                'url': f"https://reddit.com{post.permalink}",
                'text': post.selftext,
                'author_description': author_description,
                'full_content': full_content,
                'subreddit': subreddit,
                'created_utc': post.created_utc
            })
            
            # Respect Reddit's rate limits
            time.sleep(1)
            
        return results
    except Exception as e:
        print(f"⚠️ Error scraping {subreddit}: {str(e)}")
        return []

def extract_skills_and_location(post_text: str) -> Dict:
    """Extract mentioned skills and location from the post using GPT-4."""
    prompt = f"""
Analyze the following post and extract:
1. Technical skills mentioned (as a comma-separated list)
2. Location mentioned (city, state, country, or "Remote")
3. If no location is explicitly mentioned, return "Not specified"

Post:
\"\"\"{post_text}\"\"\"

Return in this format:
Skills: skill1, skill2, skill3
Location: extracted location
"""
    output = safe_gpt_call(prompt, max_retries=3, delay=5)
    if not output:
        return {"skills": [], "location": "Not specified"}
    
    # Parse the output
    skills_line = [line for line in output.splitlines() if line.startswith('Skills:')]
    location_line = [line for line in output.splitlines() if line.startswith('Location:')]
    
    skills = [s.strip() for s in skills_line[0].replace('Skills:', '').split(',')] if skills_line else []
    location = location_line[0].replace('Location:', '').strip() if location_line else 'Not specified'
    
    return {
        "skills": skills,
        "location": location
    }

def summarize_post(post_text: str, job_title: str, required_skills: List[str], location: str) -> Dict:
    """Summarize and score a post using GPT-4."""
    prompt = f"""
Given the Reddit post below, analyze it for a {job_title} position:
Required Skills: {', '.join(required_skills)}
Desired Location: {location}

Post:
\"\"\"{post_text}\"\"\"

Provide:
1. One-sentence summary
2. Is the poster looking for work in this field? (Yes/No)
3. Skills Match Score (0-10): How well do their skills match requirements?
4. Location Match Score (0-10): How well does their location match? (10 for remote or exact match)
5. Overall Relevance Score (0-10): Considering all factors
"""
    output = safe_gpt_call(prompt, max_retries=3, delay=5)
    if not output:
        return {"summary": "", "is_candidate": False, "score": 0}
    
    # Parse the output
    is_candidate = "Yes" in output
    relevance_line = [line for line in output.splitlines() if "Overall Relevance Score" in line]
    try:
        score = int(relevance_line[0].split(":")[1].strip().split('/')[0]) if relevance_line else 0
    except:
        score = 0
        
    return {
        "summary": output,
        "is_candidate": is_candidate,
        "score": score
    }

def store_lead(db: Session, lead_data: Dict):
    """Store a lead in the database. If email exists, update the existing lead."""
    try:
        # Check if lead with this email already exists
        if lead_data.get('email') and lead_data['email'] != "Not provided":
            existing_lead = db.query(Lead).filter(Lead.email == lead_data['email']).first()
            if existing_lead:
                # Update existing lead with new information
                for key, value in lead_data.items():
                    if key != 'id' and hasattr(existing_lead, key):  # Don't update id
                        setattr(existing_lead, key, value)
                existing_lead.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_lead)
                print(f"✅ Updated existing lead with email: {lead_data['email']}")
                return existing_lead

        # Create new lead if no duplicate email found
        lead = Lead(
            username=lead_data['author'],
            platform="Reddit",
            profile_url=lead_data['url'],
            summary=lead_data['summary'],
            relevance_score=lead_data['score'],
            job_title=lead_data['job_title'],
            job_id=lead_data.get('job_id'),  # New job_id field
            skills=lead_data['skills'],
            location=lead_data['location'],
            email=lead_data.get('email'),
            contact_info=lead_data.get('contact_info', ''),
            subreddit=lead_data['subreddit'],
            status="NEW",
            created_at=datetime.fromtimestamp(lead_data.get('created_utc', time.time()))
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        print(f"✅ Created new lead for {lead_data['author']}")
        return lead
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error storing lead: {str(e)}")
        return None

# --- LinkedIn Sourcing Functions ---

def get_linkedin_profiles(search_query: str, location: str, max_results=20) -> list:
    """Trigger PhantomBuster LinkedIn Search Export and fetch profiles."""
    if not all([PHANTOMBUSTER_API_KEY, PHANTOMBUSTER_PHANTOM_ID]):
        print("⚠️ PhantomBuster credentials not configured")
        return []

    headers = {"X-Phantombuster-Key-1": PHANTOMBUSTER_API_KEY}

    # Trigger the Phantom
    trigger_url = "https://api.phantombuster.com/api/v2/agents/launch"
    trigger_payload = {"id": PHANTOMBUSTER_PHANTOM_ID, "saveResult": True}
    
    try:
        launch_response = requests.post(trigger_url, headers=headers, json=trigger_payload).json()
        print("⏳ PhantomBuster task launched... Waiting for data...")
        time.sleep(20)  # Initial wait

        # Fetch results
        result_url = f"https://api.phantombuster.com/api/v2/agents/fetch-output?id={PHANTOMBUSTER_PHANTOM_ID}"
        profiles = []

        for _ in range(10):
            res = requests.get(result_url, headers=headers).json()
            output = res.get('output', {}).get('resultObject', [])
            if output:
                profiles = output[:max_results]
                print(f"✅ Retrieved {len(profiles)} LinkedIn profiles")
                break
            time.sleep(10)

        return profiles
    except Exception as e:
        print(f"⚠️ Error fetching LinkedIn profiles: {str(e)}")
        return []

def analyze_linkedin_profile(profile: dict, job_title: str, required_skills: list, location: str) -> dict:
    """Analyze a LinkedIn profile using GPT-4 for job relevance."""
    description = profile.get('description', '')
    prompt = f"""
Given the LinkedIn profile description below, analyze it for a {job_title} role.
Required Skills: {', '.join(required_skills)}
Desired Location: {location}

Profile Description:
\"\"\"{description}\"\"\"

Provide:
1. One-sentence summary
2. Skills Match Score (0-10)
3. Location Match Score (0-10)
4. Overall Relevance Score (0-10)
"""
    output = safe_gpt_call(prompt)
    if not output:
        return {"profile": profile, "summary": "", "score": 0}

    try:
        relevance_line = next(l for l in output.splitlines() if "Overall Relevance Score" in l)
        score = int(relevance_line.split(":")[1].strip().split('/')[0])
    except:
        score = 0

    return {
        "profile": profile,
        "summary": output,
        "score": score
    }

# --- Existing Reddit Functions ---

async def generate_leads(job_title: str, skills: List[str], location: str, db: Session, job_id: int, max_leads: int = 30) -> List[Dict]:
    """Main function to generate and store leads from both Reddit and LinkedIn."""
    leads = []
    total_leads_evaluated = 0
    max_leads_per_subreddit = max_leads // 5  # Divide among subreddits evenly
    
    # Check API credentials
    if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET]):
        print("⚠️ Reddit API credentials not configured")
    else:
        print("\n🔍 Searching Reddit for candidates...")
        try:
            # Generate Reddit leads
            relevance_threshold = 3
            subreddits = predict_subreddits(job_title, skills, location)
            print("✅ Suggested subreddits:", subreddits)

            for sub in subreddits:
                if total_leads_evaluated >= max_leads:
                    print(f"✋ Reached maximum lead limit ({max_leads})")
                    break
                    
                print(f"\n📂 Scraping posts from {sub}...")
                posts = scrape_subreddit_posts(sub, skills, limit=max_leads_per_subreddit)

                for post in posts:
                    if total_leads_evaluated >= max_leads:
                        break
                        
                    print(f"\n📝 Analyzing Reddit post by u/{post['author']}...")
                    total_leads_evaluated += 1
                    
                    extracted_info = extract_skills_and_location(post['text'])
                    contact_info = extract_contact_info(post['full_content'])
                    analysis = summarize_post(post['text'], job_title, skills, location)
                    print(f"🤖 Analysis: {analysis}")
                    print(f"🤖 Is candidate: {analysis['is_candidate']}")
                    print(f"🤖 Score: {analysis['score']}")
                    
                    if analysis['is_candidate'] and analysis['score'] >= relevance_threshold:
                        lead_data = {
                            'author': post['author'],
                            'url': post['url'],
                            'summary': analysis['summary'],
                            'score': analysis['score'],
                            'job_title': job_title,
                            'job_id': job_id,
                            'skills': extracted_info['skills'],
                            'location': extracted_info['location'],
                            'email': contact_info['email'],
                            'contact_info': contact_info['contact_info'],
                            'subreddit': sub,
                            'created_utc': post.get('created_utc')
                        }
                        
                        stored_lead = store_lead(db, lead_data)
                        if stored_lead:
                            leads.append(lead_data)
                            print(f"✅ Stored Reddit lead for u/{post['author']} with score {analysis['score']}/10")
                    
                    time.sleep(1)
        except Exception as e:
            print(f"⚠️ Error in Reddit lead generation: {str(e)}")

    return leads

async def find_candidates(job_id: int, skills: List[str], location: str, db: Session, background_tasks: BackgroundTasks):
    """API endpoint to find candidates for a job from multiple sources."""
    try:
        # First, find the job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            print(f"⚠️ Job not found for ID: {job_id}")
            return {
                "status": "error",
                "message": "Job not found. Please provide a valid job ID."
            }

        # Start lead generation in background
        background_tasks.add_task(
            generate_leads,
            job.title,
            skills,
            location,
            db,
            job_id
        )
        
        return {
            "status": "success",
            "message": f"Lead generation started in background for job: {job.title}. Will evaluate up to 30 candidates.",
            "job_id": job_id
        }
    except ValueError as ve:
        return {
            "status": "error",
            "message": str(ve)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"An error occurred: {str(e)}"
        } 