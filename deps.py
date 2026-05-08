from fastapi import Cookie, HTTPException
from database import get_conn

def get_current_user(uid: str | None = Cookie(default=None)):
    if uid is None:
        raise HTTPException(status_code=401, detail="Not logged in")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT name FROM users WHERE uid=?", (uid,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid user")

    return {"uid": uid, "name": row[0]}