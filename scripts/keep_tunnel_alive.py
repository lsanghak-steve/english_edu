import time, urllib.request

print("Starting Tunnel Keep-Alive ping loop...")

while True:
    try:
        req = urllib.request.Request('https://english-edu-live-yc.loca.lt', headers={'bypass-tunnel-reminder': 'true'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"[{time.strftime('%H:%M:%S')}] Tunnel ping status: {res.status}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Tunnel ping failed: {e}")
    time.sleep(10)
