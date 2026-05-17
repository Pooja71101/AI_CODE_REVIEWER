import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# DATABASE_URL = "sqlite:///./reviews.db"
DATABASE_URL =os.getenv("DATABASE_URL", "sqlite:///./reviews.db")

# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"check_same_thread": False},
#     pool_size=1,
#     max_overflow=0,
# )

# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Base = declarative_base()