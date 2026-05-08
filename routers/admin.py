from fastapi import APIRouter, Form
from database import get_conn

router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

@router.get("/users")
def get_users():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, student_id, name
        FROM users
        ORDER BY id ASC
    """)

    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "student_id": r[1],
            "name": r[2]
        }
        for r in rows
    ]

@router.post("/users")
def create_user(
    student_id: str = Form(...),
    name: str = Form(...)
):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO users (student_id, name)
        VALUES (?, ?)
    """, (student_id, name))

    conn.commit()
    conn.close()

    return {"message": "ユーザー追加成功"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {"message": "ユーザー削除成功"}