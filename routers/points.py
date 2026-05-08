from fastapi import APIRouter, Form, Depends
from database import get_conn
from collections import Counter
from fastapi import HTTPException


router = APIRouter(
    prefix="/points",
    tags=["points"]
)

@router.get("/")
def list_points():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, name, description, lat, lon, created_by, forecast_code, amedas_code
        FROM points
        ORDER BY id DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "name": r[1],
            "description": r[2],
            "lat": r[3],
            "lon": r[4],
            "created_by": r[5],
            "forecast_code": r[6],
            "amedas_code": r[7]
        }
        for r in rows
    ]


@router.post("/")
def create_point(
    name: str = Form(...),
    description: str = Form(""),
    lat: float = Form(...),
    lon: float = Form(...),
    created_by: str = Form(...),
    forecast_code: str = Form(...),
    amedas_code: str = Form(...)
):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO points (name, description, lat, lon, created_by, forecast_code, amedas_code)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, description, lat, lon, created_by, forecast_code, amedas_code))

    conn.commit()
    conn.close()

    return {"message": "ポイント追加成功"}


@router.get("/{point_id}/analysis")
def get_point_analysis(point_id: int):
    conn = get_conn()
    cur = conn.cursor()

    # まずポイント名を取る
    cur.execute("SELECT name FROM points WHERE id = ?", (point_id,))
    point_row = cur.fetchone()

    if not point_row:
        conn.close()
        return {"error": "point not found"}

    point_name = point_row[0]

    # そのポイント名に一致する投稿を取る
    cur.execute("""
        SELECT fish, size, created_at, weather, tide
        FROM posts
        WHERE place = ?
    """, (point_name,))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {
            "point_name": point_name,
            "post_count": 0,
            "caught_count": 0,
            "no_catch_count": 0,
            "catch_rate": 0,
            "top_fish": [],
            "avg_size": None,
            "top_time_zone": [],
            "top_caught_time_zone": [],
            "top_tide": [],
            "top_weather": []
            
        }

    fish_list = []
    sizes = []
    time_zones = []
    tides = []
    weathers = []
    caught_count = 0
    no_catch_count = 0
    caught_time_zones = []

    for fish, size, created_at, weather, tide in rows:
        is_no_catch = fish == "釣果なし" or size == 0

        if is_no_catch:
            no_catch_count += 1
        else:
            caught_count += 1

            if fish:
                fish_list.append(fish)

            if size is not None:
                sizes.append(size)

        if tide:
            tides.append(tide)

        if weather:
            weathers.append(weather)

        if created_at:
            hour = int(created_at[11:13])

            if 4 <= hour < 10:
                zone = "朝"
            elif 10 <= hour < 16:
                zone = "昼"
            elif 16 <= hour < 20:
                zone = "夕方"
            else:
                zone = "夜"

            time_zones.append(zone)

            if not is_no_catch:
                caught_time_zones.append(zone)

    def top3(items):
        if not items:
            return []

        counter = Counter(items)
        return counter.most_common(3)

    avg_size = round(sum(sizes) / len(sizes), 1) if sizes else None
    catch_rate = round(caught_count / len(rows) * 100, 1) if rows else 0

    time_zone_counts = Counter(time_zones)
    caught_zone_counts = Counter(caught_time_zones)

    success_rate_by_time = {}

    for zone in ["朝", "昼", "夕方", "夜"]:
        total = time_zone_counts.get(zone, 0)
        caught = caught_zone_counts.get(zone, 0)

        if total > 0:
            success_rate_by_time[zone] = round(caught / total * 100, 1)
        else:
            success_rate_by_time[zone] = None

    return {
        "point_name": point_name,
        "post_count": len(rows),
        "caught_count": caught_count,
        "no_catch_count": no_catch_count,
        "catch_rate": catch_rate,
        "avg_size": avg_size,
        "top_fish": top3(fish_list),
        "top_caught_time_zone": top3(caught_time_zones),
        "top_tide": top3(tides),
        "top_weather": top3(weathers),
        "success_rate_by_time": success_rate_by_time,
                     
    }

@router.delete("/{point_id}")
def delete_point(point_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM points WHERE id = ?", (point_id,))
    point = cur.fetchone()

    if not point:
        conn.close()
        raise HTTPException(status_code=404, detail="ポイントが見つかりません")

    cur.execute("DELETE FROM points WHERE id = ?", (point_id,))
    conn.commit()
    conn.close()

    return {"message": "ポイントを削除しました"}