from fastapi import APIRouter
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/jma_tide")
def get_jma_tide():
    url = "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=S1"

    res = requests.get(url, timeout=10)
    res.encoding = res.apparent_encoding

    soup = BeautifulSoup(res.text, "html.parser")
    text = soup.get_text("\n", strip=True)

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # 👇 日付だけ（曜日無視）
    today = datetime.now().strftime("%Y/%m/%d")

    target_parts = []
    collecting = False

    for line in lines:
        # 👇 startswith → in に変更（重要）
        if today in line:
            collecting = True

        if collecting:
            # 次の日付で止める
            if re.match(r"^\d{4}/\d{2}/\d{2}", line) and today not in line:
                break
            target_parts.append(line)

    target_line = " ".join(target_parts)

    if not target_line:
        return {"high": [], "low": []}

    times = re.findall(r"\b\d{1,2}:\d{2}\b", target_line)

    high = []
    low = []

    if len(times) >= 1:
        high.append(times[0])
    if len(times) >= 2:
        low.append(times[1])
    if len(times) >= 3:
        high.append(times[2])
    if len(times) >= 4:
        low.append(times[3])

    return {
        "high": high,
        "low": low
    }

@router.get("/tide")
def get_tide():
    now = datetime.now()

    yr = now.year
    mn = now.month
    dy = now.day

    # 秋田あたりの仮設定
    pc = 4
    hc = 11

    url = (
        f"https://tide736.net/api/get_tide.php"
        f"?pc={pc}&hc={hc}&yr={yr}&mn={mn}&dy={dy}&rg=day"
    )

    res = requests.get(url, timeout=10)
    res.raise_for_status()

    return res.json()