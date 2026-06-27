#!/usr/bin/env python3
"""Svuota i dati degli account di TEST. NON tocca demo@lisianext.it."""
import json, os, urllib.request, urllib.error

URL = os.environ["SB_URL"].rstrip("/")
ANON = os.environ["SB_ANON"]
PROTETTO = "demo@lisianext.it"

# account di test da svuotare (email, password)
TEST = [
    ("avv.test.1781790660377@lisianext.it", "TestVerifica2026!"),
    ("probe.1781778989@lisianext.it", "DemoLisia2026!"),
    ("studio.moretti@lisianext.it", "DemoLisia2026!"),
]

def call(method, path, token, base="rest"):
    b = {"rest": "/rest/v1", "auth": "/auth/v1"}[base]
    h = {"apikey": ANON, "Authorization": f"Bearer {token}", "Content-Type": "application/json",
         "Prefer": "return=minimal"}
    r = urllib.request.Request(URL + b + path, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return f"{e.code} {e.read().decode()[:120]}"

def login(email, pwd):
    body = json.dumps({"email": email, "password": pwd}).encode()
    r = urllib.request.Request(URL + "/auth/v1/token?grant_type=password", data=body,
        headers={"apikey": ANON, "Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=30) as resp:
        return json.load(resp)

for email, pwd in TEST:
    if email.strip().lower() == PROTETTO:
        print(f"SALTO (protetto): {email}")
        continue
    try:
        tok = login(email, pwd)
    except urllib.error.HTTPError as e:
        print(f"login FALLITO {email}: {e.code} (salto)")
        continue
    TOKEN = tok["access_token"]
    uid = tok["user"]["id"]
    # ordine: prima ciò che referenzia clienti, poi clienti (cascade), poi liste
    esiti = {}
    for t in ["conversazioni", "documenti", "attivita", "cause", "clienti", "cronologia", "preferiti"]:
        esiti[t] = call("DELETE", f"/{t}?user_id=eq.{uid}", TOKEN)
    print(f"PULITO {email} (uid {uid[:8]}): {esiti}")

print("\nFatto. Demo NON toccato. Gli account-utente vuoti restano in Supabase Auth (eliminabili a mano dal dashboard).")
