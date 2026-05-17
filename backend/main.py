from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header

import google.generativeai as genai
from models import Review, User
from database import SessionLocal, engine
# from models import Review
from database import Base
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import bcrypt

from dotenv import load_dotenv
import os

load_dotenv()

# Configure Gemini
genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

# model = genai.GenerativeModel("gemini-1.5-flash")
model = genai.GenerativeModel("gemini-2.5-flash-lite")

app = FastAPI()
Base.metadata.create_all(bind=engine)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
# Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-code-reviewer-1r0dyxxru-py878685gmailcoms-projects.vercel.app",
        "http://localhost:5173"],  # for local dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str
    language: str

class UserRequest(BaseModel):
    username: str
    password: str

@app.get("/")
def home():
    return {"message": "AI Code Reviewer Backend Running"}

@app.post("/signup")
def signup(user: UserRequest):

    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_user:

        db.close()

        return {
            "error": "User already exists"
        }

    # hashed_password = pwd_context.hash(
    #     user.password
    # )
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = User(
        username=user.username,
        password=hashed_password
    )

    db.add(new_user)

    db.commit()

    db.close()

    return {
        "message": "User created successfully"
    }

@app.post("/login")
def login(user: UserRequest):

    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.username == user.username
    ).first()

    if not existing_user:

        db.close()

        return {
            "error": "User not found"
        }

    # valid_password = pwd_context.verify(
    #     user.password,
    #     existing_user.password
    # )
    valid_password = bcrypt.checkpw(user.password.encode('utf-8'), existing_user.password.encode('utf-8'))

    if not valid_password:

        db.close()

        return {
            "error": "Invalid password"
        }

    token = jwt.encode(
        {
            "sub": existing_user.username,
            "exp": datetime.utcnow() + timedelta(days=1)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    db.close()

    return {
        "token": token
    }



@app.post("/review")


def review_code(request: CodeRequest, authorization: str = Header(None)):

    try:

        prompt = f"""
        You are an expert {request.language} software engineer.

        Review the following code.

        Respond in proper markdown format.

        Include:

        # Overall Review

        # Bugs

        # Optimization Suggestions

        # Time Complexity

        # Best Practices

        # Improved Version

        Code:
        {request.code}
        """
        
        response = model.generate_content(prompt)

        payload = jwt.decode(
            authorization,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        # SAVE TO DATABASE HERE
        db = SessionLocal()

        new_review = Review(
            username=username,
            language=request.language,
            code=request.code,
            review=response.text
        )

        db.add(new_review)

        db.commit()

        db.close()

        # return {
            # "review": response.text
        return {
             "review": getattr(response, "text", "No AI response")
}
        # }

    except Exception as e:
        return {
            "error": str(e)
        }
    
@app.get("/reviews")
def get_reviews( authorization: str = Header(None)):
     
    payload = jwt.decode(
            authorization,
            SECRET_KEY,
            algorithms=[ALGORITHM]
    )

    username = payload.get("sub")

    db = SessionLocal()

    reviews = db.query(Review).filter(
    Review.username == username
    ).all()

    db.close()

    return reviews







# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware

# from openai import OpenAI
# from dotenv import load_dotenv

# import os

# # Load environment variables
# # print(os.getenv("OPENAI_API_KEY"))
# load_dotenv()

# # OpenAI client
# client = OpenAI(
#     api_key=os.getenv("OPENAI_API_KEY")
# )

# app = FastAPI()

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Request body
# class CodeRequest(BaseModel):
#     code: str


# @app.get("/")
# def home():
#     return {"message": "AI Code Reviewer Backend Running"}


# @app.post("/review")
# def review_code(request: CodeRequest):

#     try:

#         prompt = f"""
#         Review this code:

#         {request.code}
#         """

#         response = client.chat.completions.create(
#             model="gpt-4.1-mini",
#             messages=[
#                 {
#                     "role": "user",
#                     "content": prompt
#                 }
#             ]
#         )

#         review = response.choices[0].message.content

#         return {
#             "review": review
#         }

#     except Exception as e:
#         print(e)

#         return {
#             "error": str(e)
#         }



# @app.post("/review")
# def review_code(request: CodeRequest):

#     prompt = f"""
# You are a senior software engineer.

# Review the following code.

# Give:
# 1. Bugs
# 2. Code quality feedback
# 3. Optimization suggestions
# 4. Time complexity
# 5. Clean code improvements

# Code:
# {request.code}
# """

#     response = client.chat.completions.create(
#         model="gpt-4.1-mini",
#         messages=[
#             {
#                 "role": "user",
#                 "content": prompt
#             }
#         ]
#     )

#     review = response.choices[0].message.content

#     return {
#         "review": review
#     }


# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def home():
#     return {"message": "AI Code Reviewer Backend Running"}

# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# # Allow frontend to talk to backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Request body model
# class CodeRequest(BaseModel):
#     code: str


# @app.get("/")
# def home():
#     return {"message": "Backend Running"}


# @app.post("/review")
# def review_code(request: CodeRequest):

#     code = request.code

#     # Temporary fake AI response
#     return {
#         "review": f"""
# Your code looks good.

# Possible Improvements:
# 1. Use better variable names
# 2. Reduce nested loops if possible
# 3. Add comments

# Code received:
# {code}
# """
#     }