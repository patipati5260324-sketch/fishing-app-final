from fastapi import APIRouter, Form
from database import get_conn

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/login")
def login(student_id: str = Form(...)):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, student_id, name
        FROM users
        WHERE student_id = ?
    """, (student_id,))

    row = cur.fetchone()
    conn.close()

    if not row:
        return {"success": False, "message": "学籍番号が見つかりません"}

    is_admin = True if row[1] == "7023911" else False

    return {
        "success": True,
        "user": {
            "id": row[0],
            "student_id": row[1],
            "name": row[2],
            "is_admin": is_admin
        }
    }