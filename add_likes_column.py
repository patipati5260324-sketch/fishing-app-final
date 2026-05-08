import sqlite3

conn = sqlite3.connect("fishing.db")
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0")
    conn.commit()
    print("likes列追加OK")
except Exception as e:
    print("すでにある or エラー:", e)

conn.close()