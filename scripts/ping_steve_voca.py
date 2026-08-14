import time, urllib.request

print("Starting Keep-Alive ping for https://steve-voca.loca.lt ...")

while True:
    try:
        req = urllib.request.Request('https://steve-voca.loca.lt', headers={'bypass-tunnel-reminder': 'true'})
        res = urllib.request.urlopen(req, timeout=5)
        print(f"[{time.strftime('%H:%M:%S')}] Steve Voca Tunnel ping OK: {res.status}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Steve Voca Tunnel ping err: {e}")
    time.sleep(5)
