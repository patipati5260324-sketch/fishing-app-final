import requests
from datetime import datetime

def calc_moon_age(dt: datetime) -> float:
    base = datetime(2000, 1, 6)
    days = (dt - base).total_seconds() / 86400
    return round(days % 29.53, 1)

def calc_tide(moon_age: float) -> str:
    if moon_age < 2 or moon_age > 27:
        return "大潮"
    elif 5 < moon_age < 10 or 20 < moon_age < 25:
        return "中潮"
    else:
        return "小潮"

def get_weather(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
        "daily": "sunrise,sunset",
        "forecast_days": 1,
        "timezone": "Asia/Tokyo"
    }
    res = requests.get(url, params=params, timeout=10).json()

    moon_age = calc_moon_age(datetime.now())
    tide = calc_tide(moon_age)

    return {
        "temp": res["current"]["temperature_2m"],
        "wind": res["current"]["wind_speed_10m"],
        "wind_deg": res["current"]["wind_direction_10m"],
        "sunrise": res["daily"]["sunrise"][0],
        "sunset": res["daily"]["sunset"][0],
        "moon_age": moon_age,
        "tide": tide
    }