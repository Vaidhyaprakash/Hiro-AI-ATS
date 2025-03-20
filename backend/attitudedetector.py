import cv2
import numpy as np
import librosa
import whisper
import torch
from deepface import DeepFace
from transformers import pipeline
from scipy.signal import find_peaks
import subprocess
import os
import boto3
import aioboto3
from moviepy.editor import VideoFileClip

# Check for CUDA (GPU acceleration)
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load models
whisper_model = whisper.load_model("base").to(device)
sentiment_pipeline = pipeline("sentiment-analysis", device=0 if device == "cuda" else -1)

# Organization's Culture Code (Example)
org_culture = {
    "confidence": 0.8,
    "positivity": 0.7,
    "enthusiasm": 0.9,
    "calmness": 0.6
}

def extract_audio_from_video(video_path, output_audio_path="extracted_audio.wav"):
    """Extracts audio from a video file and saves it as a WAV file."""
    command = f"ffmpeg -i {video_path} -ac 1 -ar 44100 -vn {output_audio_path} -y"
    try:
        subprocess.run(command, shell=True, check=True)
        
        # Check if audio file exists
        if os.path.exists(output_audio_path) and os.path.getsize(output_audio_path) > 0:
            print(f"✅ Audio extracted and saved as: {output_audio_path} ({os.path.getsize(output_audio_path)} bytes)")
            return output_audio_path
        else:
            print("❌ Audio extraction failed: File not created or empty")
            return None
    except subprocess.CalledProcessError as e:
        print(f"❌ Error extracting audio: {e}")
        return None

def analyze_video(video_path):
    """Extracts facial expressions from video and determines emotion distribution."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return None

    emotions = []
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % 10 == 0:  # Process every 10th frame
            try:
                result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
                emotion = result[0]['dominant_emotion'] if isinstance(result, list) else result['dominant_emotion']
                emotions.append(emotion)
            except Exception as e:
                print(f"DeepFace failed on frame {frame_count}, error: {e}")
                continue

    cap.release()

    # Calculate emotion distribution
    unique_emotions, counts = np.unique(emotions, return_counts=True)
    emotion_distribution = {emotion: count / len(emotions) for emotion, count in zip(unique_emotions, counts)}

    return emotion_distribution

def analyze_audio(audio_path):
    """Extracts tone & sentiment from voice."""
    # Convert speech to text
    result = whisper_model.transcribe(audio_path)
    transcript = result["text"]

    # Get sentiment analysis
    sentiment_result = sentiment_pipeline(transcript)
    sentiment_label = sentiment_result[0]["label"]
    sentiment_score = sentiment_result[0]["score"]

    # Extract audio pitch (proxy for enthusiasm)
    y, sr = librosa.load(audio_path, sr=None)
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

    # Find peak pitch values
    pitch_values = pitches[pitches > 0]  # Ignore zero values
    pitch_mean = np.mean(pitch_values) if len(pitch_values) > 0 else 0

    return {
        "transcript": transcript,
        "sentiment": sentiment_label,
        "positivity": sentiment_score,
        "enthusiasm": min(1, pitch_mean / 300)  # Normalize enthusiasm (0-1)
    }

S3_ENDPOINT_URL = "http://localhost:4566"  # LocalStack URL
S3_BUCKET_NAME = "videos"
AWS_ACCESS_KEY = "test"
AWS_SECRET_KEY = "test"

# Ensure bucket exists
s3_client = boto3.client("s3", endpoint_url=S3_ENDPOINT_URL, aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY)
s3_client.create_bucket(Bucket=S3_BUCKET_NAME)

# Function to extract audio
def extract_audio(video_path, audio_path):
    """Extracts audio from video using MoviePy."""
    try:
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path, codec='pcm_s16le')
        return audio_path
    except Exception as e:
        print(f"Error extracting audio: {e}")
        return None

# Function to upload file to S3
async def upload_to_s3(file_path, key):
    """Uploads file to S3 (LocalStack)."""
    async with aioboto3.client("s3", endpoint_url=S3_ENDPOINT_URL, aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY) as s3:
        with open(file_path, "rb") as file:
            await s3.upload_fileobj(file, S3_BUCKET_NAME, key)
    print(f"✅ Uploaded {key} to S3")

def compare_with_culture(attitude_params):
    """Compares candidate's attitude with the company's culture code."""
    match_scores = {}

    for trait, ideal_value in org_culture.items():
        candidate_value = attitude_params.get(trait, 0)
        match_scores[trait] = 1 - abs(ideal_value - candidate_value)

    overall_match = sum(match_scores.values()) / len(org_culture)
    
    return match_scores, overall_match


async def process_video_and_audio(video_key, audio_key):
    """Fetch video & audio from S3, analyze both, and compare with organization culture code."""

    async with aioboto3.client("s3", endpoint_url=S3_ENDPOINT_URL, aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY) as s3:
        # Fetch Video
        video_response = await s3.get_object(Bucket=S3_BUCKET_NAME, Key=video_key)
        video_data = await video_response["Body"].read()
        video_path = f"/tmp/{video_key}"
        with open(video_path, "wb") as f:
            f.write(video_data)

        # Fetch Audio
        audio_response = await s3.get_object(Bucket=S3_BUCKET_NAME, Key=audio_key)
        audio_data = await audio_response["Body"].read()
        audio_path = f"/tmp/{audio_key}"
        with open(audio_path, "wb") as f:
            f.write(audio_data)

    # 🔍 Step 1: Analyze Video (Facial Expressions & Gestures)
    video_results = analyze_video(video_path)

    # 🔍 Step 2: Analyze Audio (Speech Tone, Transcription)
    audio_results = analyze_audio(audio_path)

    # 🔍 Step 3: Compare Results with Culture Code (Example Logic)
    final_analysis = compare_with_culture(video_results, audio_results)

    print(f"✅ Final Analysis: {final_analysis}")

# Example Usage
# video_path = "candidate_interview.mp4"
# audio_path = extract_audio_from_video(video_path)

# video_analysis = analyze_video(video_path)
# audio_analysis = analyze_audio(audio_path)

# # Combine extracted attitude parameters
# attitude_parameters = {
#     "confidence": video_analysis.get("happy", 0) + video_analysis.get("neutral", 0),  # Happy/neutral → Confidence
#     "positivity": audio_analysis["positivity"],
#     "enthusiasm": audio_analysis["enthusiasm"],
#     "calmness": video_analysis.get("neutral", 0) - video_analysis.get("angry", 0)  # More neutral, less angry → Calmness
# }

# # Compare with organization's culture code
# match_scores, overall_match = compare_with_culture(attitude_parameters)

# print("\n📌 Candidate Attitude Parameters:", attitude_parameters)
# print("📌 Match Scores:", match_scores)
# print(f"✅ Overall Culture Match: {overall_match:.2f} (out of 1.0)")
