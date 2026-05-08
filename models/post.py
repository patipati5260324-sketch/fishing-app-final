from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    fish = Column(String, nullable=False)
    size = Column(Integer)
    place = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    image_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)