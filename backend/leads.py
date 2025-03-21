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
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import re

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
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")  # Add SerpAPI key

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
    """Store a lead in the database. If username exists, update the existing lead."""
    try:
        # Check if lead with this username already exists
        if lead_data.get('author'):
            existing_lead = db.query(Lead).filter(Lead.username == lead_data['author']).first()
            if existing_lead:
                # Update existing lead with new information
                for key, value in lead_data.items():
                    if key != 'id' and hasattr(existing_lead, key):  # Don't update id
                        setattr(existing_lead, key, value)
                existing_lead.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_lead)
                print(f"✅ Updated existing lead for username: {lead_data['author']}")
                return existing_lead

        # Generate a unique email if none provided
        if not lead_data.get('email') or lead_data['email'] == "Not provided":
            timestamp = int(datetime.utcnow().timestamp())
            unique_email = f"no-email-{timestamp}@placeholder.com"
            lead_data['email'] = unique_email

        # Create new lead if no duplicate username found
        lead = Lead(
            username=lead_data['author'],
            platform=lead_data.get('platform', 'LinkedIn'),  # Default to LinkedIn if not specified
            profile_url=lead_data['url'],
            summary=lead_data['summary'],
            relevance_score=lead_data['score'],
            job_title=lead_data['job_title'],
            job_id=lead_data.get('job_id'),
            skills=lead_data['skills'],
            location=lead_data['location'],
            email=lead_data['email'],
            contact_info=lead_data.get('contact_info', ''),
            subreddit=lead_data.get('subreddit', ''),  # Default to empty string if not specified
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

def get_linkedin_profiles(job_title: str, location: str, max_results=20) -> list:
    """Use SerpAPI to find LinkedIn profiles."""
    profiles = []
    try:
        if not SERPAPI_KEY:
            print("⚠️ SerpAPI key not configured")
            return profiles
            
        # Construct search query
        search_query = f'site:linkedin.com/in/ "{job_title}" "{location}"'
        
        print(f"🔍 Searching for LinkedIn profiles using SerpAPI: {search_query}")
        
        # Make request to SerpAPI
        params = {
            'api_key': SERPAPI_KEY,
            'engine': 'google',
            'q': search_query,
            'num': 10,  # Get more results
            'gl': 'us',  # Force US results
            'hl': 'en'   # Force English
        }
        
        # Add retry logic
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = requests.get('https://serpapi.com/search', params=params, timeout=30)
                response.raise_for_status()
                
                if response.status_code == 200:
                    break
                    
            except requests.RequestException as e:
                print(f"⚠️ SerpAPI request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                continue
                
        if response.status_code != 200:
            print(f"⚠️ Failed to get search results after {max_retries} attempts")
            return profiles
            
        data = response.json()
        organic_results = data.get('organic_results', [])
        
        print(f"📊 Found {len(organic_results)} search results")
        
        for result in organic_results:
            try:
                # Extract LinkedIn URL
                link = result.get('link', '')
                if not link or 'linkedin.com/in/' not in link:
                    continue
                
                # Get title/name
                title = result.get('title', '')
                name = title.split(' - ')[0].split('|')[0].strip() if title else "Unknown"
                
                # Get snippet/description
                snippet = result.get('snippet', '')
                
                # Extract location and headline
                location = ""
                headline = ""
                
                # Try to extract location from parentheses or after dash/pipe
                location_patterns = [
                    r'\((.*?)\)',  # Text in parentheses
                    r'(?:[-|])([^-|]+?)(?=[-|]|$)',  # Text after dash or pipe
                ]
                
                for pattern in location_patterns:
                    matches = re.findall(pattern, snippet)
                    if matches:
                        location = matches[0].strip()
                        break
                
                # Extract headline - usually the first part before separators
                headline_parts = re.split(r'[|\-]', snippet)
                if headline_parts:
                    headline = headline_parts[0].strip()
                
                profile_data = {
                    'name': name,
                    'headline': headline,
                    'location': location or 'Not specified',
                    'description': snippet,
                    'linkedinUrl': link
                }
                
                print(f"✅ Found profile: {name} - {headline}")
                profiles.append(profile_data)
                
                if len(profiles) >= max_results:
                    break
                    
                # Add small delay between processing results
                time.sleep(0.5)
                
            except Exception as e:
                print(f"⚠️ Error parsing result: {str(e)}")
                continue
        
        print(f"✅ Successfully found {len(profiles)} LinkedIn profiles")
        return profiles
        
    except Exception as e:
        print(f"⚠️ Error in SerpAPI search for LinkedIn profiles: {str(e)}")
        return []

def analyze_linkedin_profile(profile: dict, job_title: str, required_skills: list, location: str) -> dict:
    """Analyze a LinkedIn profile using GPT-4 for job relevance."""
    description = profile.get('description', '')
    prompt = f"""
You are a lenient recruiter analyzing a LinkedIn profile for a {job_title} position.
Required Skills: {', '.join(required_skills)}
Desired Location: {location}

Profile Description:
\"\"\"{description}\"\"\"

Analyze this profile and provide scores in this EXACT format:
Summary: [One sentence about the candidate's background and fit]
Skills Match: [Score 0-10, where 10 means perfect match and 5 means partial match]
Location Match: [Score 0-10, where 10 means exact match or remote, 5 means nearby]
Overall Score: [Score 0-10, considering all factors]

Be lenient in scoring:
- Skills: Give 5+ if they have some relevant skills
- Location: Give 5+ if they're in the same country or remote
- Overall: Give 5+ if they seem generally qualified
"""
    output = safe_gpt_call(prompt)
    if not output:
        return {"profile": profile, "summary": "No analysis available", "score": 5}  # Default to 5 instead of 0

    try:
        # Extract summary
        summary = ""
        summary_line = next((l for l in output.splitlines() if l.startswith('Summary:')), None)
        if summary_line:
            summary = summary_line.replace('Summary:', '').strip()

        # Extract scores
        scores = {
            'skills': 5,  # Default to 5
            'location': 5,  # Default to 5
            'overall': 5   # Default to 5
        }

        # Try to extract scores from the output
        for line in output.splitlines():
            if 'Skills Match:' in line:
                try:
                    scores['skills'] = int(line.split(':')[1].strip().split('/')[0])
                except:
                    pass
            elif 'Location Match:' in line:
                try:
                    scores['location'] = int(line.split(':')[1].strip().split('/')[0])
                except:
                    pass
            elif 'Overall Score:' in line:
                try:
                    scores['overall'] = int(line.split(':')[1].strip().split('/')[0])
                except:
                    pass

        # Ensure scores are at least 5 if we found any relevant information
        if description and any(skill.lower() in description.lower() for skill in required_skills):
            scores['skills'] = max(5, scores['skills'])
        if location.lower() in description.lower() or 'remote' in description.lower():
            scores['location'] = max(5, scores['location'])
        
        # Calculate final score as average of all scores, minimum 5
        final_score = max(5, sum(scores.values()) // len(scores))

        return {
            "profile": profile,
            "summary": summary or "Profile analyzed",
            "score": final_score,
            "detailed_scores": scores
        }

    except Exception as e:
        print(f"⚠️ Error in score extraction: {str(e)}")
        return {
            "profile": profile,
            "summary": "Error in analysis",
            "score": 5,  # Default to 5 instead of 0
            "detailed_scores": {'skills': 5, 'location': 5, 'overall': 5}
        }

def extract_company_domain(linkedin_url: str) -> str:
    """Extract company domain from LinkedIn URL or profile data."""
    try:
        # First try to get company from LinkedIn URL
        if "company" in linkedin_url:
            parts = linkedin_url.split("/company/")
            if len(parts) > 1:
                company_slug = parts[1].split("/")[0]
                # Try common domain patterns
                domains = [
                    f"{company_slug}.com",
                    f"{company_slug}.io",
                    f"{company_slug}.org",
                    f"{company_slug}.net",
                    f"{company_slug}.co"
                ]
                return domains[0]  # Return the most common pattern
        
        # If no company in URL, try to extract from profile URL
        if "linkedin.com/in/" in linkedin_url:
            # Try to get company from the profile URL structure
            profile_parts = linkedin_url.split("/in/")
            if len(profile_parts) > 1:
                # Try to find company in the URL path
                path_parts = profile_parts[1].split("/")
                if len(path_parts) > 1:
                    company_slug = path_parts[1]
                    return f"{company_slug}.com"
        
        return None
    except Exception as e:
        print(f"⚠️ Error extracting company domain: {str(e)}")
        return None

def get_email_from_hunter(full_name: str, company_domain: str = None, linkedin_url: str = None) -> Dict:
    """Use Hunter.io to find email addresses."""
    if not HUNTER_API_KEY:
        print("⚠️ Hunter.io API key not configured")
        return {"email": "Not provided", "score": 0}

    try:
        # If no company domain provided, try to extract from LinkedIn URL
        if not company_domain and linkedin_url:
            company_domain = extract_company_domain(linkedin_url)
            if company_domain:
                print(f"🔍 Extracted company domain: {company_domain}")

        if not company_domain:
            print("⚠️ No company domain available for email search")
            return {"email": "Not provided", "score": 0}

        # Clean up the full name
        full_name = full_name.strip()
        name_parts = full_name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[-1] if len(name_parts) > 1 else ""

        print(f"🔍 Searching for email for: {full_name} at {company_domain}")

        # Try email finder first (more accurate)
        response = requests.get(
            "https://api.hunter.io/v2/email-finder",
            params={
                "domain": company_domain,
                "full_name": full_name,
                "api_key": HUNTER_API_KEY,
                "first_name": first_name,
                "last_name": last_name
            }
        )
        
        if response.status_code == 200:
            data = response.json().get('data', {})
            email = data.get('email')
            score = data.get('score', 0)
            
            if email and score > 0:
                print(f"✅ Found email via email finder: {email} (score: {score})")
                return {
                    "email": email,
                    "score": score
                }

        # If email finder didn't work, try domain search
        response = requests.get(
            "https://api.hunter.io/v2/domain-search",
            params={
                "domain": company_domain,
                "api_key": HUNTER_API_KEY,
                "limit": 100  # Get more results
            }
        )

        if response.status_code == 200:
            data = response.json()
            emails = data.get('data', {}).get('emails', [])
            
            # Try to find matching email
            for email_data in emails:
                email_first_name = email_data.get('first_name', '').lower()
                email_last_name = email_data.get('last_name', '').lower()
                
                # Check if names match
                if (email_first_name in first_name.lower() and 
                    email_last_name in last_name.lower()):
                    email = email_data.get('value')
                    confidence = email_data.get('confidence', 0)
                    print(f"✅ Found email via domain search: {email} (confidence: {confidence})")
                    return {
                        "email": email,
                        "score": confidence
                    }

        print("⚠️ No email found")
        return {"email": "Not provided", "score": 0}

    except Exception as e:
        print(f"⚠️ Error in Hunter.io API call: {str(e)}")
        return {"email": "Not provided", "score": 0}

async def process_linkedin_leads(job_title: str, skills: List[str], location: str, db: Session, job_id: int, max_leads: int = 2) -> List[Dict]:
    """Process LinkedIn leads using Google Search and Llama3."""
    leads = []
    try:
        # Get LinkedIn profiles via Google Search
        profiles = get_linkedin_profiles(job_title, location, max_results=max_leads)
        
        for profile in profiles:
            print(f"\n🔍 Analyzing LinkedIn profile: {profile.get('name', 'Unknown')}")
            
            # Analyze profile with Llama3
            analysis = analyze_linkedin_profile(profile, job_title, skills, location)
            print(f"🤖 Analysis: {analysis}")
            print(f"🤖 Score: {analysis['score']}")
            if analysis['score'] >= 3:  # Only process high-scoring profiles
                # Get email using Hunter.io
                email_info = get_email_from_hunter(
                    profile.get('name', ''),
                    extract_company_domain(profile.get('linkedinUrl', '')),
                    profile.get('linkedinUrl')
                )
                
                lead_data = {
                    'author': profile.get('name', 'Unknown'),
                    'platform': 'LinkedIn',
                    'url': profile.get('linkedinUrl'),
                    'summary': analysis['summary'],
                    'score': analysis['score'],
                    'job_title': job_title,
                    'job_id': job_id,
                    'skills': skills,
                    'location': profile.get('location', 'Not specified'),
                    'email': email_info['email'],
                    'contact_info': f"LinkedIn: {profile.get('linkedinUrl')}",
                    'subreddit': '',  # Add empty subreddit field for LinkedIn leads
                    'created_utc': int(datetime.utcnow().timestamp())
                }
                
                stored_lead = store_lead(db, lead_data)
                if stored_lead:
                    leads.append(lead_data)
                    print(f"✅ Stored LinkedIn lead: {profile.get('name')} with score {analysis['score']}/10")
            
            time.sleep(1)  # Rate limiting
            
    except Exception as e:
        print(f"⚠️ Error processing LinkedIn leads: {str(e)}")
    
    return leads

# Update the generate_leads function to include LinkedIn processing
async def generate_leads(job_title: str, skills: List[str], location: str, db: Session, job_id: int, max_leads: int = 2) -> List[Dict]:
    """Main function to generate and store leads from both Reddit and LinkedIn."""
    all_leads = []
    max_leads_per_source = max_leads // 2  # Split between Reddit and LinkedIn
    
    # # Process Reddit leads
    reddit_leads = await process_reddit_leads(job_title, skills, location, db, job_id, max_leads_per_source)
    all_leads.extend(reddit_leads)
    
    # Process LinkedIn leads
    linkedin_leads = await process_linkedin_leads(job_title, skills, location, db, job_id, max_leads_per_source)
    all_leads.extend(linkedin_leads)
    
    return all_leads

async def process_reddit_leads(job_title: str, skills: List[str], location: str, db: Session, job_id: int, max_leads: int) -> List[Dict]:
    """Process Reddit leads."""
    leads = []
    total_leads_evaluated = 0
    max_leads_per_subreddit = max_leads // 5  # Divide among subreddits evenly
    
    if not all([REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET]):
        print("⚠️ Reddit API credentials not configured")
        return leads

    print("\n🔍 Searching Reddit for candidates...")
    try:
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
                        'platform': 'Reddit',
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

        # Check if smart hire has already been enabled for this job
        if job.smart_hire_enabled:
            print(f"⚠️ Smart hire has already been triggered for job ID: {job_id}")
            return {
                "status": "error",
                "message": "Smart hire has already been triggered for this job."
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
        
        # Update smart_hire_enabled flag
        job.smart_hire_enabled = True
        db.commit()
        
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

async def get_job_leads(job_id: int, db: Session):
    """Get all leads for a specific job."""
    try:
        # Get the job first to check smart_hire_enabled
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return {
                "status": "error",
                "message": "Job not found"
            }

        if not job.smart_hire_enabled:
            return {
                "status": "error",
                "message": "Smart hire not enabled for this job"
            }

        # Get all leads for this job
        leads = db.query(Lead).filter(Lead.job_id == job_id).all()
        
        return {
            "status": "success",
            "leads": [{
                "id": lead.id,
                "name": lead.username,
                "platform": lead.platform,
                "profile_url": lead.profile_url,
                "email": lead.email,
                "location": lead.location,
                "skills": lead.skills,
                "relevance_score": lead.relevance_score,
                "status": lead.status,
                "contact_info": lead.contact_info,
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
                "updated_at": lead.updated_at.isoformat() if lead.updated_at else None
            } for lead in leads]
        }
    except Exception as e:
        print(f"⚠️ Error getting leads: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        } 