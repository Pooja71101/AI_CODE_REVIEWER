from sqlalchemy import Column, Integer, String, Text

from database import Base

class Review(Base):

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    language = Column(String)

    code = Column(Text)

    review = Column(Text)

    username = Column(String)


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)

    password = Column(String)