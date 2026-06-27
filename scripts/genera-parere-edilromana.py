#!/usr/bin/env python3
import json, os, uuid, urllib.request, urllib.error

URL = os.environ["SB_URL"].rstrip("/")
ANON = os.environ["SB_ANON"]
KEY = os.environ["ANTHROPIC_API_KEY"]
EMAIL, PASSWORD = "demo@lisianext.it", "LisiaDemo2026!"

def sb(method, path, token, body=None, headers=None, base="rest"):
    b = {"rest": "/rest/v1", "auth": "/auth/v1"}[base]
    h = {"apikey": ANON, "Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if headers: h.update(headers)
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + b + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=60) as resp:
        t = resp.read().decode()
        return resp.status, (json.loads(t) if t and t[0] in "[{" else t)

# login
_, tok = sb("POST", "/token?grant_type=password", ANON,
            {"email": EMAIL, "password": PASSWORD}, base="auth")
TOKEN = tok["access_token"]

# Edilromana + causa
_, cli = sb("GET", "/clienti?select=id,ragione_sociale,tipo,cause(id,oggetto,materia,controparte,foro)&ragione_sociale=eq.Edilromana%20S.r.l.", TOKEN)
c = cli[0]; ca = c["cause"][0]
print("Cliente:", c["ragione_sociale"], "| causa:", ca["oggetto"])

PREAMBOLO = """Sei l'assistente legale AI di LisiaNext, una piattaforma per avvocati italiani.
Chi ti interroga è un professionista legale qualificato che rivede e si assume la responsabilità dei contenuti: non rifiutare la normale attività di analisi e redazione giuridica.

Regole generali:
- Rispondi sempre in italiano, con registro giuridico preciso e professionale.
- Fonda l'analisi sul diritto italiano (codici, leggi speciali, principi consolidati di legittimità e di merito).
- Sii accurato: non inventare MAI estremi di sentenze, numeri di articolo o massime. Riporta l'estremo specifico di una pronuncia (numero e data) solo quando ne sei ragionevolmente certo; in caso di dubbio descrivi l'orientamento giurisprudenziale consolidato senza numeri, e NON aggiungere diciture tipo "(da verificare)". Le citazioni puntuali verificate arriveranno dalla banca dati delle sentenze.
- Quando mancano dati di fatto, usa segnaposto chiari tra parentesi quadre, es. [DATA], [IMPORTO], [NOME CONTROPARTE].
- Struttura la risposta in markdown pulito (titoli, elenchi puntati dove utile). Niente premesse inutili."""

SYS = PREAMBOLO + """

Modalità: PARERE LEGALE APPROFONDITO.
Redigi un parere pro veritate completo, rigoroso e con taglio operativo, nello stile di un avvocato esperto. Segui FEDELMENTE questa struttura, usando i titoli di sezione con numerazione romana e i sottoparagrafi con numerazione decimale.

INTESTAZIONE (in cima, prima del titolo):
- **Avv. [NOME COGNOME]** su una riga
- specializzazione/foro su riga successiva, es. "Avvocato — [Materia]" (usa la materia della pratica se fornita)
- "Lisia Legal AI / LisiaNext" su riga successiva
Usa segnaposto tra parentesi quadre per i dati non forniti (nome, luogo). NON inventare nomi propri o date.

Poi:
- Titolo: ## PARERE LEGALE
- Riga "**OGGETTO:** ..." con una sintesi puntuale del tema (una-due righe).

Sezioni (titoli come ## I. QUESITO, ## II. PREMESSE IN FATTO, ecc.):
- **I. QUESITO** — riformula con precisione il quesito posto.
- **II. PREMESSE IN FATTO** — inquadra il contesto fattuale e l'istituto rilevante; se i fatti non sono completi, ragiona per ipotesi esplicitandole.
- **III. INQUADRAMENTO GIURIDICO** (o "ANALISI ...") — analizza la fattispecie; se utile, elenca cause/profili con elenco numerato.
- **IV. [MERITO]** — la parte centrale, articolata in sottoparagrafi ### 4.1 ..., ### 4.2 ... con i rimedi/argomenti, ciascuno motivato e con i riferimenti normativi.
- **V. SINTESI ...** — quando il parere indica una sequenza di azioni/passaggi, riassumili in una TABELLA markdown (colonne tipo: Fase | Azione | Termine / Note).
- **VI. CONCLUSIONI** — conclusione operativa chiara: cosa conviene fare, in che ordine, con quali cautele e termini.

In chiusura, dopo le conclusioni:
- riga di disclaimer: "Il presente parere è reso sulla base delle circostanze rappresentate e della normativa vigente alla data odierna; ulteriori elementi fattuali potranno condurre a valutazioni differenti."
- "Con osservanza," seguito da "[Luogo], [data]" e "Avv. [NOME COGNOME]" come segnaposto.

Stile e contenuto:
- Registro forense formale ma chiaro e leggibile.
- Cita le NORME in modo puntuale (articoli di codice, leggi, decreti).
- Cita la GIURISPRUDENZA con estremi completi SOLO quando sei ragionevolmente certo; altrimenti descrivi l'orientamento senza estremi.
- Metti in **grassetto** gli istituti chiave e i termini perentori.
- Approfondisci: il parere deve essere esaustivo, non un riassunto."""

PROMPT = ("Redigi un parere legale completo e approfondito sulle strategie di recupero del credito di "
"€ 45.000,00 vantato da Edilromana S.r.l. nei confronti di Beta Costruzioni S.r.l. per una fornitura "
"di merce regolarmente consegnata e accettata, rimasta non pagata. Analizza in modo esaustivo: "
"(i) la qualificazione del rapporto e la prova del credito (fattura, DDT, mancata contestazione); "
"(ii) il riparto dell'onere probatorio; (iii) la fase stragiudiziale (diffida e messa in mora, "
"eventuale piano di rientro, riconoscimento di debito); (iv) il ricorso per decreto ingiuntivo, "
"anche provvisoriamente esecutivo, con i relativi presupposti probatori; (v) l'eventuale opposizione "
"e i suoi rischi; (vi) l'azione ordinaria di cognizione come alternativa; (vii) gli interessi moratori "
"nelle transazioni commerciali; (viii) le misure cautelari e conservative a tutela del credito "
"(sequestro conservativo); (ix) i profili di solvibilità della debitrice e le verifiche preventive; "
"(x) la strategia operativa consigliata con tempistiche.")

contesto = (f"\n\nContesto della pratica (usa questi dati nella risposta):\n"
f"- Cliente: {c['ragione_sociale']} (azienda)\n"
f"- Pratica: {ca['oggetto']}\n- Materia: {ca['materia']}\n"
f"- Controparte: {ca['controparte']}\n- Foro/Autorità: {ca['foro']}")
USER = PROMPT + contesto

print("Genero parere (Opus 4.8, effort high)...")
body = json.dumps({"model": "claude-opus-4-8", "max_tokens": 32000,
    "thinking": {"type": "adaptive"}, "output_config": {"effort": "high"},
    "system": SYS, "messages": [{"role": "user", "content": USER}]}).encode()
req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body,
    headers={"x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
with urllib.request.urlopen(req, timeout=600) as resp:
    d = json.load(resp)
parere = "".join(b.get("text", "") for b in d["content"] if b.get("type") == "text")
print("Lunghezza parere:", len(parere), "char |", d["usage"]["output_tokens"], "token output")

now = "2026-06-18T15:30:00Z"
conv = {"id": str(uuid.uuid4()), "modulo": "pareri",
    "titolo": "Parere — Strategie di recupero credito € 45.000 (Edilromana / Beta Costruzioni)",
    "messaggi": [
        {"id": "m"+uuid.uuid4().hex[:8], "ruolo": "utente", "contenuto": PROMPT, "createdAt": now},
        {"id": "m"+uuid.uuid4().hex[:8], "ruolo": "assistente", "contenuto": parere, "createdAt": now}],
    "cliente_id": c["id"], "causa_id": ca["id"], "created_at": now, "updated_at": now}
st, _ = sb("POST", "/conversazioni", TOKEN, [conv], headers={"Prefer": "return=minimal"})
print("salvataggio conversazione:", st)
sb("POST", "/cronologia", TOKEN, [{"testo": conv["titolo"], "tipo": "Parere", "created_at": now}],
   headers={"Prefer": "return=minimal"})
print("FATTO — parere salvato nel fascicolo di Edilromana.")
