#!/usr/bin/env python3
"""Crea un utente demo popolato su Supabase (via REST, rispettando la RLS)."""
import json, os, sys, uuid, urllib.request, urllib.error

URL = os.environ["SB_URL"].rstrip("/")
ANON = os.environ["SB_ANON"]
EMAIL = os.environ.get("DEMO_EMAIL", "demo@lisianext.it")
PASSWORD = os.environ.get("DEMO_PASS", "LisiaDemo2026!")
NOME = "Avv. Laura Bianchi"
STUDIO = "Studio Legale Bianchi & Partners"
PDF_PATH = os.environ.get("PDF_PATH", "")

def req(method, path, token, body=None, extra_headers=None, raw=None, base="rest"):
    base_url = {"rest": "/rest/v1", "auth": "/auth/v1", "storage": "/storage/v1"}[base]
    h = {"apikey": ANON, "Authorization": f"Bearer {token}"}
    if extra_headers: h.update(extra_headers)
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if raw is None and body is not None: h["Content-Type"] = "application/json"
    r = urllib.request.Request(base_url and URL + base_url + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt and txt[0] in "[{" else txt)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# 1) Signup (auto-confirm)
status, res = req("POST", "/signup", ANON, body={"email": EMAIL, "password": PASSWORD,
                  "data": {"nome_completo": NOME}}, base="auth")
if status >= 400 and "already" in str(res).lower():
    # già esiste -> login
    status, res = req("POST", "/token?grant_type=password", ANON,
                      body={"email": EMAIL, "password": PASSWORD}, base="auth")
if isinstance(res, str): res = json.loads(res)
TOKEN = res["access_token"]
UID = res["user"]["id"]
print(f"Utente: {EMAIL}  id={UID}")

ins = {"Prefer": "return=minimal", "Content-Type": "application/json"}

# pulizia eventuale (idempotente): rimuove dati precedenti di questo utente
for t in ["conversazioni", "documenti", "attivita", "cause", "clienti", "cronologia"]:
    req("DELETE", f"/{t}?user_id=eq.{UID}", TOKEN, extra_headers={"Prefer": "return=minimal"})

# profilo: studio
req("PATCH", f"/profiles?id=eq.{UID}", TOKEN, body={"studio": STUDIO}, extra_headers={"Prefer": "return=minimal"})

def U(): return str(uuid.uuid4())

# ---- CLIENTI ----
c1, c2, c3, c4 = U(), U(), U(), U()
clienti = [
  {"id": c1, "tipo": "persona", "nome": "Paolo", "cognome": "Ferri", "email": "paolo.ferri@email.it",
   "telefono": "+39 06 5551234", "codice_fiscale": "FRRPLA75M01H501Z", "citta": "Roma",
   "indirizzo": "Via Verdi 12", "tags": ["Condominio"], "note": "Condomino. Contestazione bolletta idrica.",
   "created_at": "2026-05-08T09:00:00Z"},
  {"id": c2, "tipo": "azienda", "ragione_sociale": "Edilromana S.r.l.", "partita_iva": "12345678901",
   "email": "amministrazione@edilromana.it", "telefono": "+39 06 5559876", "citta": "Roma",
   "indirizzo": "Via Tiburtina 220", "tags": ["Recupero crediti", "Appalti"],
   "note": "Cliente storico. Diverse pratiche di recupero crediti.", "created_at": "2026-04-15T09:00:00Z"},
  {"id": c3, "tipo": "persona", "nome": "Anna", "cognome": "Greco", "email": "anna.greco@email.it",
   "telefono": "+39 02 5552233", "codice_fiscale": "GRCNNA88T45F205X", "citta": "Milano",
   "tags": ["Lavoro"], "note": "Licenziamento ritenuto illegittimo.", "created_at": "2026-05-20T09:00:00Z"},
  {"id": c4, "tipo": "persona", "nome": "Marco", "cognome": "Donati", "email": "marco.donati@email.it",
   "telefono": "+39 06 5554455", "citta": "Roma", "tags": ["Famiglia"],
   "note": "Separazione consensuale.", "created_at": "2026-06-01T09:00:00Z"},
]
cs = [req("POST", "/clienti", TOKEN, body=[r], extra_headers=ins)[0] for r in clienti]
print("clienti:", cs)

# ---- CAUSE ----
ca1, ca2, ca3, ca4 = U(), U(), U(), U()
cause = [
  {"id": ca1, "cliente_id": c1, "oggetto": "Contestazione consumo idrico anomalo in condominio",
   "materia": "civile", "controparte": "Condominio Via Verdi 12", "foro": "Tribunale di Roma",
   "numero_ruolo": "R.G. 8842/2026", "stato": "in_corso", "valore": 3500,
   "prossima_udienza": "2026-09-15T09:30:00Z", "note": "Perizia esclude perdite interne.",
   "created_at": "2026-05-08T09:10:00Z"},
  {"id": ca2, "cliente_id": c2, "oggetto": "Recupero credito per fornitura non saldata (€ 45.000)",
   "materia": "commerciale", "controparte": "Beta Costruzioni S.r.l.", "foro": "Tribunale di Roma",
   "stato": "aperta", "valore": 45000, "note": "Fattura insoluta, merce consegnata e accettata.",
   "created_at": "2026-04-16T09:10:00Z"},
  {"id": ca3, "cliente_id": c3, "oggetto": "Impugnazione del licenziamento", "materia": "lavoro",
   "controparte": "Tech Solutions S.r.l.", "foro": "Tribunale di Milano - Sez. Lavoro",
   "numero_ruolo": "R.G. 1190/2026", "stato": "in_corso", "valore": 28000,
   "prossima_udienza": "2026-07-30T10:00:00Z", "created_at": "2026-05-20T09:10:00Z"},
  {"id": ca4, "cliente_id": c4, "oggetto": "Separazione consensuale", "materia": "famiglia",
   "controparte": "—", "foro": "Tribunale di Roma", "stato": "in_corso",
   "created_at": "2026-06-01T09:10:00Z"},
]
cus = [req("POST", "/cause", TOKEN, body=[r], extra_headers=ins)[0] for r in cause]
print("cause:", cus)

# ---- ATTIVITA (storico) ----
att = [
  {"cliente_id": c1, "causa_id": ca1, "data": "2026-05-08T09:15:00Z", "tipo": "incarico",
   "titolo": "Conferimento incarico", "descrizione": "Mandato per contestazione addebito idrico."},
  {"cliente_id": c1, "causa_id": ca1, "data": "2026-05-20T11:00:00Z", "tipo": "comunicazione",
   "titolo": "Richiesta documentazione all'amministratore", "descrizione": "PEC: letture contatore e criteri di riparto."},
  {"cliente_id": c1, "causa_id": ca1, "data": "2026-06-02T16:00:00Z", "tipo": "deposito",
   "titolo": "Acquisita perizia tecnica", "descrizione": "Perizia esclude perdite nell'unità."},
  {"cliente_id": c2, "causa_id": ca2, "data": "2026-04-16T10:00:00Z", "tipo": "incarico",
   "titolo": "Conferimento incarico", "descrizione": "Recupero credito € 45.000."},
  {"cliente_id": c2, "causa_id": ca2, "data": "2026-04-28T12:00:00Z", "tipo": "comunicazione",
   "titolo": "Diffida ad adempiere", "descrizione": "Raccomandata A/R alla debitrice."},
  {"cliente_id": c3, "causa_id": ca3, "data": "2026-05-20T10:00:00Z", "tipo": "incarico",
   "titolo": "Conferimento incarico", "descrizione": "Impugnazione licenziamento."},
  {"cliente_id": c3, "causa_id": ca3, "data": "2026-06-10T09:00:00Z", "tipo": "udienza",
   "titolo": "Prima udienza fissata", "descrizione": "30/07/2026 ore 10:00."},
  {"cliente_id": c4, "causa_id": ca4, "data": "2026-06-01T10:00:00Z", "tipo": "incarico",
   "titolo": "Conferimento incarico", "descrizione": "Separazione consensuale."},
]
print("attivita:", req("POST", "/attivita", TOKEN, body=att, extra_headers=ins)[0])

# ---- CONVERSAZIONI AI (pareri / atti / chat) ----
def msgs(dom, risp, t):
    return [
      {"id": "m"+U()[:8], "ruolo": "utente", "contenuto": dom, "createdAt": t},
      {"id": "m"+U()[:8], "ruolo": "assistente", "contenuto": risp, "createdAt": t},
    ]

PARERE = """**Avv. [NOME COGNOME]**
Avvocato — Diritto Civile e Condominiale
Lisia Legal AI / LisiaNext

## PARERE LEGALE

**OGGETTO:** Strumenti di tutela del condomino avverso l'addebito di un consumo idrico anomalo, in presenza di perizia che esclude perdite nell'unità.

## I. QUESITO
Si chiede di individuare gli strumenti — stragiudiziali e giudiziali — esperibili dal condomino cui è imputato un consumo idrico superiore alla media, allorché una perizia abbia escluso anomalie interne all'appartamento.

## II. PREMESSE IN FATTO
Il consumo viene ripartito in assenza di contatori divisionali secondo i millesimi. La perizia che esclude perdite interne orienta la responsabilità verso le **parti comuni** o verso un **errore di contabilizzazione**.

## III. INQUADRAMENTO GIURIDICO
Il rendiconto deve rispettare i principi di chiarezza e veridicità (**art. 1130-bis c.c.**). L'impianto idrico fino alla diramazione è parte comune (**art. 1117 c.c.**); le perdite sui tratti comuni sono spesa condominiale (**art. 1123 c.c.**).

## IV. STRUMENTI DI TUTELA
### 4.1 Accesso documentale
Richiesta scritta (PEC) di letture, criteri di riparto e bollette del gestore.
### 4.2 Verifica metrologica del contatore
Istanza al gestore idrico per accertare malfunzionamenti.
### 4.3 Impugnazione della delibera
Se il consuntivo è già approvato, impugnazione **ex art. 1137 c.c.** entro **trenta giorni**.
### 4.4 Mediazione obbligatoria
Condizione di procedibilità **ex art. 5 D.Lgs. 28/2010**.

## V. SINTESI OPERATIVA

| Fase | Azione | Termine / Note |
|------|--------|----------------|
| 1 | Accesso documentale all'amministratore (PEC) | Subito |
| 2 | Verifica metrologica del contatore | Quanto prima |
| 3 | Impugnazione delibera (se approvata) | **30 giorni** (art. 1137 c.c.) |
| 4 | Istanza di mediazione | Prima del ricorso |

## VI. CONCLUSIONI
La perizia favorevole sposta sul condominio l'onere di giustificare l'addebito. È determinante non lasciare decorrere il **termine di trenta giorni** per l'impugnazione.

---
Il presente parere è reso sulla base delle circostanze rappresentate; ulteriori elementi potranno condurre a valutazioni differenti.

Con osservanza,
[Luogo], [data]
Avv. [NOME COGNOME]"""

ATTO = """**TRIBUNALE ORDINARIO DI ROMA**

**ATTO DI CITAZIONE**

* * *

Per **Edilromana S.r.l.**, P.IVA [P.IVA], in persona del legale rappresentante p.t., rappresentata e difesa dall'Avv. [NOME COGNOME], giusta procura in calce;
**— attrice —**

**CONTRO**

**Beta Costruzioni S.r.l.**, in persona del legale rappresentante p.t.;
**— convenuta —**

* * *

**PREMESSO IN FATTO CHE**
1. In data [DATA] l'attrice forniva alla convenuta merce per € 45.000,00, come da DDT sottoscritti per ricevuta (doc. 1-2).
2. A fronte della fornitura veniva emessa fattura n. [N.] del [DATA], rimasta insoluta (doc. 3).
3. La diffida del [DATA] (doc. 4) non sortiva alcun esito.

**IN DIRITTO**
Il credito è certo, liquido ed esigibile (artt. 1470 e 1498 c.c.). Trattandosi di transazione commerciale, sono dovuti gli interessi **ex D.Lgs. 231/2002**.

**CITA**
la convenuta a comparire all'udienza del [DATA], con invito a costituirsi nel termine di legge (art. 166 c.p.c.), con avvertimento ex art. 167 c.p.c., per ivi sentir accogliere le seguenti

**CONCLUSIONI**
- condannare la convenuta al pagamento di € 45.000,00 oltre interessi ex D.Lgs. 231/2002;
- con vittoria di spese e competenze.

[Luogo], [data] — Avv. [NOME COGNOME]"""

CHAT_Q = "Il termine per impugnare una delibera condominiale è perentorio?"
CHAT_A = """Sì, è **perentorio**. Il condomino assente, dissenziente o astenuto può impugnare la delibera **entro trenta giorni** (**art. 1137, comma 2, c.c.**), decorrenti dalla deliberazione (per i presenti) o dalla comunicazione del verbale (per gli assenti).

Decorso tale termine, l'azione di annullamento è preclusa; resta esperibile solo l'azione di nullità, non soggetta a termine, nei casi tassativi (oggetto impossibile/illecito, difetto assoluto di competenza dell'assemblea).

**In pratica:** verificare subito la data del verbale e attivarsi entro i 30 giorni, valutando anche la mediazione obbligatoria (art. 5 D.Lgs. 28/2010)."""

conv = [
  {"id": U(), "modulo": "pareri", "titolo": "Parere — Consumo idrico anomalo in condominio",
   "messaggi": msgs("Quali tutele ha il condomino per un consumo idrico anomalo, con perizia che esclude perdite interne?", PARERE, "2026-06-03T15:00:00Z"),
   "cliente_id": c1, "causa_id": ca1, "created_at": "2026-06-03T15:00:00Z", "updated_at": "2026-06-03T15:00:00Z"},
  {"id": U(), "modulo": "redattore", "titolo": "Atto di citazione — Recupero credito Edilromana",
   "messaggi": msgs("Redigi un atto di citazione per il recupero del credito di € 45.000 verso Beta Costruzioni.", ATTO, "2026-05-02T11:00:00Z"),
   "cliente_id": c2, "causa_id": ca2, "created_at": "2026-05-02T11:00:00Z", "updated_at": "2026-05-02T11:00:00Z"},
  {"id": U(), "modulo": "risposta_immediata", "titolo": CHAT_Q,
   "messaggi": msgs(CHAT_Q, CHAT_A, "2026-06-05T09:30:00Z"),
   "cliente_id": None, "causa_id": None, "created_at": "2026-06-05T09:30:00Z", "updated_at": "2026-06-05T09:30:00Z"},
]
print("conversazioni:", req("POST", "/conversazioni", TOKEN, body=conv, extra_headers=ins)[0])

# ---- CRONOLOGIA ----
cron = [
  {"testo": "Parere — Consumo idrico anomalo in condominio", "tipo": "Parere", "created_at": "2026-06-03T15:00:00Z"},
  {"testo": "Atto di citazione — Recupero credito Edilromana", "tipo": "Atto", "created_at": "2026-05-02T11:00:00Z"},
  {"testo": CHAT_Q, "tipo": "Chat", "created_at": "2026-06-05T09:30:00Z"},
  {"testo": "Ricerca: licenziamento illegittimo reintegra", "tipo": "Sentenze", "created_at": "2026-05-22T14:00:00Z"},
]
print("cronologia:", req("POST", "/cronologia", TOKEN, body=cron, extra_headers=ins)[0])

# ---- DOCUMENTO (upload reale su Storage) ----
if PDF_PATH and os.path.exists(PDF_PATH):
    pdf = open(PDF_PATH, "rb").read()
    path = f"{UID}/{c1}/{U()}-Perizia_idrica.pdf"
    st, _ = req("POST", f"/object/documenti/{path}", TOKEN, raw=pdf,
                extra_headers={"Content-Type": "application/pdf", "x-upsert": "true"}, base="storage")
    print("upload pdf:", st)
    if st < 300:
        dst, _ = req("POST", "/documenti", TOKEN, body=[{
            "cliente_id": c1, "causa_id": ca1, "nome": "Perizia_idrica",
            "estensione": "pdf", "storage_path": path, "created_at": "2026-06-02T16:00:00Z"}],
            extra_headers=ins)
        print("documenti:", dst)
else:
    print("PDF non trovato, salto upload documento")

print("\nFATTO. Credenziali demo: ", EMAIL, "/", PASSWORD)
