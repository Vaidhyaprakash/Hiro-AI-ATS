import os
from flask import Flask, request, Response
from twilio.rest import Client
from dotenv import load_dotenv
import requests
import openai
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Get environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def download_audio(recording_url):
    """Download the Twilio call recording"""
    filename="call_recording.wav"
    response = requests.get(recording_url, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))

    if response.status_code == 200:
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"✅ Recording downloaded: {filename}")
        return filename
    else:
        print(f"❌ Failed to download recording. Status Code: {response}")
        return None

def transcribe_audio(filename):
    """Transcribe the audio using OpenAI Whisper"""
    openai.api_key = OPENAI_API_KEY
    with open(filename, "rb") as audio_file:
        transcript = openai.Audio.transcribe("whisper-1", audio_file)
    print("✅ Transcription completed.")
    return transcript["text"]

def generate_summary(transcript):
    """Generate an HR interview summary and score using GPT-4"""
    prompt = f"""
    You are an HR assistant analyzing an interview transcript. Evaluate the candidate's performance and provide:
    1. A score out of 10 (based on communication skills, clarity of responses, professionalism, and overall impression)
    2. A concise summary of their performance
    3. Key strengths and areas for improvement

    Interview Transcript:
    {transcript}

    Format your response as follows:
    SCORE: [X/10]
    SUMMARY: [2-3 sentences about overall performance]
    STRENGTHS: [2-3 key strengths]
    IMPROVEMENTS: [2-3 areas for improvement]
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": prompt}],
        temperature=0.7
    )
    return response["choices"][0]["message"]["content"]

def extract_score(summary):
    """Extract the numerical score from the summary"""
    try:
        score_line = summary.split('\n')[0]
        score = float(score_line.split(':')[1].strip().split('/')[0])
        return score
    except:
        return None

# List of interview questions
QUESTIONS = [
    "Tell me about yourself.",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for us?"
]

# Initialize Twilio client
def get_twilio_client():
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise ValueError("Twilio credentials not properly configured")
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Webhook endpoint to receive Twilio call status updates
@app.route("/outbound_call", methods=["POST"])
def handle_outbound_call():
    """Handle and print Twilio webhook data for outbound calls."""
    print("\n=== Twilio Webhook Data ===")
    print("Call SID:", request.form.get("CallSid"))
    print("Call Status:", request.form.get("CallStatus"))
    print("From:", request.form.get("From"))
    print("To:", request.form.get("To"))
    print("Duration:", request.form.get("CallDuration"))
    print("Recording URL:", request.form.get("RecordingUrl"))
    print("Recording Duration:", request.form.get("RecordingDuration"))
    print("Speech Result:", request.form.get("SpeechResult"))
    print("All Form Data:", dict(request.form))
    print("=== End Webhook Data ===\n")
    
    try:
        CallSid = request.form.get("CallSid")
        AccountSid = request.form.get("AccountSid")
        
        # Get the recording media URL
        recording_url = f"https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Recordings/{CallSid}.wav"
        print(recording_url)
        
        # Create recordings directory if it doesn't exist
        recordings_dir = "recordings"
        if not os.path.exists(recordings_dir):
            os.makedirs(recordings_dir)
        
        # Download and process the recording
        audio_file = download_audio(recording_url)
        if audio_file:
            # Transcribe the audio
            transcript_text = transcribe_audio(audio_file)
            print("\n📝 Full Transcription:\n", transcript_text)
            
            # Generate summary and score
            summary = generate_summary(transcript_text)
            score = extract_score(summary)
            
            print("\n📊 HR Interview Evaluation:")
            print(summary)
            if score:
                print(f"\n🎯 Overall Score: {score}/10")
            
            # TODO: Store the transcript, summary, and score in the database
            # You can add database operations here to store the results
            
    except Exception as e:
        print(f"Error processing recording: {str(e)}")
    
    return Response(status=200)

# API endpoint to initiate a call
@app.route("/api/start_interview", methods=["POST"])
def start_interview():
    try:
        data = request.json
        candidate_phone = data.get("phone_number")
        job_title = data.get("job_title", "Unspecified Position")
        
        if not candidate_phone:
            return {"error": "Phone number is required"}, 400
        
        # Get the base URL for webhooks
        base_url = request.url_root.rstrip('/')
        
        # Initialize Twilio client
        client = get_twilio_client()
        
        # Make the call with status callback
        call = client.calls.create(
            to=candidate_phone,
            from_=TWILIO_PHONE_NUMBER,
            url=f"https://adjusted-quick-lizard.ngrok-free.app/start-interview",
            status_callback=f"https://adjusted-quick-lizard.ngrok-free.app/outbound_call",
            status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
            status_callback_method='POST'
        )
        
        return {
            "status": "success",
            "message": "Interview call initiated",
            "call_sid": call.sid
        }, 200
        
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

@app.route("/start-interview", methods=["POST"])
def interview_start():
    """Start the interview with the first question"""
    response = """<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say>Hello, I am an HR AI assistant from SurveySparrow. I'll be conducting your HR round today.</Say>
        <Pause length="1"/>
        <Say>After every question once you're finished speaking, remain silent for a few seconds, and I'll move on to the next question.</Say>
        <Pause length="1"/>
        <Say>{}</Say>
        <Gather input="speech" action="/next-question?index=1" method="POST" timeout="5">
        </Gather>
        <Redirect>/retry</Redirect>
    </Response>
    """.format(QUESTIONS[0])

    return Response(response, mimetype="text/xml")

@app.route("/next-question", methods=["POST"])
def next_question():
    """Ask the next question"""
    try:
        index = int(request.args.get("index", 0))
        
        if index < len(QUESTIONS):
            response = """<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>{}</Say>
                <Gather input="speech" action="/next-question?index={}" method="POST" timeout="5">
                    <Say>Please answer now.</Say>
                </Gather>
                <Redirect>/error</Redirect>
            </Response>
            """.format(QUESTIONS[index], index + 1)
        else:
            response = """<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say>Thank you for completing the interview. Our HR team will review your responses and be in touch soon.</Say>
                <Pause length="1"/>
                <Say>Goodbye!</Say>
                <Hangup/>
            </Response>
            """
        
        return Response(response, mimetype="text/xml")
    
    except Exception as e:
        print(f"Error in next_question: {str(e)}")
        return Response("""<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say>I apologize, but I encountered an error. Let me try again.</Say>
            <Gather input="speech" action="/retry" method="POST" timeout="5">
                <Say>Please respond after the beep.</Say>
            </Gather>
        </Response>
        """, mimetype="text/xml")

@app.route("/error", methods=["POST"])
def error():
    """Handle errors"""
    response = """<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say>There was an issue. Please try again later.</Say>
        <Hangup/>
    </Response>
    """
    return Response(response, mimetype="text/xml")

@app.route("/retry", methods=["POST"])
def retry():
    """Handle retry if no response is detected"""
    retry_count = int(request.args.get("retry_count", 0))
    
    if retry_count < 2:
        response = """<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say>I didn't catch your response. Let me try one more time.</Say>
            <Gather input="speech" action="/next-question" method="POST" timeout="10">
                <Say>Please respond now.</Say>
            </Gather>
            <Redirect>/retry?retry_count={}</Redirect>
        </Response>
        """.format(retry_count + 1)
    else:
        response = """<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say>I apologize, but I'm having trouble getting your response. We'll need to end this call. Our HR team will reach out to you to reschedule the interview.</Say>
            <Pause length="1"/>
            <Say>Thank you for your time. Goodbye!</Say>
            <Hangup/>
        </Response>
        """
    
    return Response(response, mimetype="text/xml")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True) 