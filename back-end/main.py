import os
from pathlib import Path
import sys

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from langchain_chroma import Chroma
from database import save_feedback, get_all_feedbacks, update_feedback_status, initialize_firestore
from ingest import create_embeddings
import logging
import firebase_admin
from firebase_admin import credentials

# Import routers
from user.router import router as user_router
from admin.router import router as admin_router
from chatbot.router import router as chatbot_router

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Khởi tạo Firebase Admin SDK một lần duy nhất."""
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
            print("Firebase Admin đã được khởi tạo thành công.")
    except Exception as e:
        logging.error(f"Error initializing Firebase Admin SDK: {str(e)}")
        raise

# Khởi tạo Firebase khi khởi động ứng dụng
initialize_firebase()

# Định nghĩa đường dẫn vectorstore (cần khớp với ingest.py)
CHROMA_DB_DIRECTORY = "./chroma_db"

# Giới hạn kích thước file upload (ví dụ: 100MB)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

# Cấu hình cơ bản
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI()

# Load vectorstore từ chroma_db
try:
    embeddings = create_embeddings()
    vectorstore = Chroma(
        persist_directory=CHROMA_DB_DIRECTORY,
        embedding_function=embeddings
    )
    logger.info("Vectorstore đã được load thành công từ chroma_db")
except Exception as e:
    logger.error(f"Lỗi khi load vectorstore: {str(e)}")
    raise

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # hoặc 5173 nếu dùng Vite
        "http://127.0.0.1:3000",
        "https://syllasbus-bot-frontend.onrender.com",
        "https://4f01-2402-800-63b6-c61f-6190-49c6-ea80-464.ngrok-free.app"  # Thêm domain ngrok
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Include routers
app.include_router(user_router, prefix="/user", tags=["user"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(chatbot_router, prefix="/chatbot", tags=["chatbot"])

@app.get("/")
async def root():
    return {"message": "Welcome to Syllabus-Bot API"}

@app.on_event("startup")
async def startup_event():
    try:
        # Initialize Firestore
        initialize_firestore()
        logger.info("Firestore initialized successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 