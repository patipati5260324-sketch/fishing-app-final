from fastapi import APIRouter, UploadFile, File, Form, Request
from database import get_conn
from datetime import datetime
import shutil
import os
import cloudinary
import cloudinary.uploader

router = APIRouter(
    prefix="/posts",
    tags=["posts"]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
def read_posts(request: Request):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, fish, size, place, image_path, created_at, likes, user_name,
       weather, temperature, wind_speed, wind_direction, tide, moon_age
        FROM posts
    """)

    rows = cur.fetchall()
    conn.close()

    result = []
    for r in rows:
        image_url = r[4]
            )
        )

        result.append({
            "id": r[0],
            "fish": r[1],
            "size": r[2],
            "place": r[3],
            "image_url": image_url,
            "created_at": r[5],
            "likes": r[6] if r[6] is not None else 0,
            "user_name": r[7] if r[7] is not None else "不明",
            "weather": r[8],
            "temperature": r[9],
            "wind_speed": r[10],
            "wind_direction": r[11],
            "tide": r[12],
            "moon_age": r[13]
        })

    return result


@router.post("/")
def create_post(
    fish: str = Form(...),
    size: int = Form(...),
    place: str = Form(...),
    lat: float = Form(...),
    lon: float = Form(...),
    user_name: str = Form(...),
    fishing_datetime: str = Form(None),

    image: UploadFile = File(...),

    forecast_code: str = Form(None),

    weather: str = Form(None),
    temperature: float = Form(None),
    wind_speed: float = Form(None),
    wind_direction: str = Form(None),
    tide: str = Form(None),
    moon_age: float = Form(None),
    

    
):
    conn = get_conn()
    cur = conn.cursor()

    upload_result = cloudinary.uploader.upload(
        image.file,
        folder="fishing_posts"
    )

    db_image_path = upload_result["secure_url"]

    created_at = fishing_datetime if fishing_datetime else datetime.now().isoformat()

    cur.execute("""
        INSERT INTO posts (fish, size, place, lat, lon, image_path, created_at, user_name, forecast_code,weather, temperature, wind_speed, wind_direction, tide, moon_age)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        fish,
        size,
        place,
        lat,
        lon,
        db_image_path,
        datetime.now().isoformat(),
        user_name,
        forecast_code,
        weather,
        temperature,
        wind_speed,
        wind_direction,
        tide,
        moon_age
    ))

    conn.commit()
    conn.close()

    return {"message": "投稿成功"}

@router.get("/map")
def get_posts_map(request: Request):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, fish, size, place, lat, lon, image_path
        FROM posts
        WHERE lat IS NOT NULL AND lon IS NOT NULL
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "fish": r[1],
            "size": r[2],
            "place": r[3],
            "lat": r[4],
            "lon": r[5],
            "image_url": r[6],
        }
        for r in rows
    ]

@router.get("/{post_id}")
def get_post(post_id: int, request: Request):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, fish, size, place, image_path, lat, lon, created_at, likes, user_name, forecast_code, weather, temperature, wind_speed, wind_direction, wave, tide, moon_age
        FROM posts
        WHERE id = ?
    """, (post_id,))

    r = cur.fetchone()

    if not r:
        conn.close()
        return {"error": "not found"}

    columns = [col[0] for col in cur.description]
    data = dict(zip(columns, r))

    conn.close()

    import os

    return {
        "id": data["id"],
        "fish": data["fish"],
        "size": data["size"],
        "place": data["place"],
        "image_url": data["image_path"],
        "lat": data["lat"],
        "lon": data["lon"],
        "created_at": data["created_at"],
        "likes": data["likes"] if data["likes"] else 0,
        "user_name": data["user_name"] if data["user_name"] else "不明",
        "forecast_code": data["forecast_code"] if data["forecast_code"] else "",
        "weather": data["weather"],
        "temperature": data["temperature"],
        "wind_speed": data["wind_speed"],
        "wind_direction": data["wind_direction"],
        "wave": data["wave"],
        "tide": data["tide"],
        "moon_age": data["moon_age"]

    }

@router.delete("/{post_id}")
def delete_post(post_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT image_path FROM posts WHERE id = ?", (post_id,))
    row = cur.fetchone()

    if not row:
        conn.close()
        return {"error": "not found"}

    image_path = row[0]
    full_image_path = os.path.join(PROJECT_ROOT, image_path)

    cur.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()

    if os.path.exists(full_image_path):
        os.remove(full_image_path)

    return {"message": "deleted"}

@router.put("/{post_id}")
def update_post(
    post_id: int,
    fish: str = Form(...),
    size: int = Form(...),
    place: str = Form(...),
):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE posts
        SET fish = ?, size = ?, place = ?
        WHERE id = ?
    """, (fish, size, place, post_id))

    conn.commit()
    conn.close()

    return {"message": "更新成功"}


@router.post("/{post_id}/like")
def like_post(post_id: int, user_id: str = Form(...)):
    conn = get_conn()
    cur = conn.cursor()

    # すでに同じ user_id がこの投稿にいいねしているか確認
    cur.execute("""
        SELECT id FROM likes
        WHERE post_id = ? AND user_id = ?
    """, (post_id, user_id))

    existing = cur.fetchone()

    if existing:
        # すでにいいね済みなら、今の likes 数を返す
        cur.execute("SELECT likes FROM posts WHERE id = ?", (post_id,))
        row = cur.fetchone()
        conn.close()

        return {
            "message": "already liked",
            "likes": row[0] if row else 0
        }

    # likes テーブルに追加
    cur.execute("""
        INSERT INTO likes (post_id, user_id)
        VALUES (?, ?)
    """, (post_id, user_id))

    # posts テーブルの likes を +1
    cur.execute("""
        UPDATE posts
        SET likes = COALESCE(likes, 0) + 1
        WHERE id = ?
    """, (post_id,))

    conn.commit()

    # 最新 likes 数を取得
    cur.execute("SELECT likes FROM posts WHERE id = ?", (post_id,))
    row = cur.fetchone()
    conn.close()

    return {
        "message": "liked",
        "likes": row[0] if row else 0
    }

@router.get("/{post_id}/liked")
def is_liked(post_id: int, user_id: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM likes
        WHERE post_id = ? AND user_id = ?
    """, (post_id, user_id))

    row = cur.fetchone()
    conn.close()

    return {"liked": True if row else False}

@router.get("/tide")
def get_tide():
    import requests
    from datetime import datetime

    now = datetime.now()

    url = f"https://api.tide736.net/get_tide.php?pc=5&hc=42&yr={now.year}&mn={now.month}&dy={now.day}&rg=day"

    res = requests.get(url)
    return res.json()