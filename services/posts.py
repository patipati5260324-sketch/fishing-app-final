import sqlite3
from sqlalchemy.orm import Session
from models.post import Post

DB = "fishing.db"

def get_posts_with_location():
    with sqlite3.connect(DB) as conn:
        cur = conn.cursor()
        cur.execute("""
        SELECT id, fish, size, place, image_path,
               tide, moon_age, datetime, lat, lon
        FROM posts
        WHERE lat IS NOT NULL AND lon IS NOT NULL
        ORDER BY datetime DESC
        """)
        rows = cur.fetchall()

    return [
        {
            "id": r[0],
            "fish": r[1],
            "size": r[2],
            "place": r[3],
            "image": r[4],
            "tide": r[5],
            "moon": r[6],
            "time": r[7],
            "lat": r[8],
            "lon": r[9],
        } for r in rows
    ]

from db import get_db

def get_posts_with_location():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM posts")
    return cursor.fetchall()

from db import get_db

def get_posts():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT id, datetime, name, fish, size, place
        FROM posts
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    return [dict(row) for row in rows]



def create_post(db: Session, post_data: dict):
    post = Post(**post_data)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def get_posts(db: Session):
    return db.query(Post).all()