# AFTER 10

Thriller/survival mobile da ~10 minuti reali, giocato su un finto sistema
operativo. Web/PWA installabile su iPhone, giocabile offline.

## Stato: M1 — slice "Pianerottolo" giocabile

Il finto OS ora si gioca. Sei chiuso in casa, qualcosa è successo sul
pianerottolo. Puoi **guardare dallo spioncino** (−8s) o **cercare in casa**
(−20s): gli indizi si accumulano in un registro e il tempo scorre. Quando arriva
`0:00`, si rivela quale delle **tre verità nascoste** (Blackout / Intrusione /
Falso allarme) stava davvero accadendo, con una **timeline causale** di cosa hai
osservato. Leggere non costa tempo; solo le azioni lo consumano (soft real-time).

Batteria visibile che cala; Sicurezza e Conoscenza restano nascoste e guidano
gli esiti.

## Architettura

- **Guscio**: React + Vite + TypeScript, PWA installabile e offline.
- **Engine** (`src/engine`): TypeScript puro, disaccoppiato da React. Regola
  d'oro `reduce(state, action) -> { state, effects[] }`, funzione pura. React è
  soltanto una **vista** dello stato: guida il tempo emettendo azioni `TICK`.
- **Soft real-time**: il clock scorre col tempo reale; leggere non costa
  secondi, solo le azioni costeranno tempo.
- **Risorse**: Tempo e Batteria visibili; Sicurezza e Conoscenza nascoste.

```
src/
  engine/      # TS puro: types, reducer, stato iniziale, format
  ui/          # componenti-vista (StatusBar, Timer, ClueLog, ActionBar, Ending)
  app/         # App + ponte React<->engine (useEngine, composition root)
  scenarios/   # slice "pianerottolo": verità, indizi, finali (pura data)
  audio/  save/ # (successivi)
tests/         # test dell'engine (Vitest)
scripts/       # generatore icone PWA
```

Lo **scenario è pura data** (`src/scenarios/pianerottolo.ts`): l'engine lo
consulta senza conoscerne il contenuto, così resta generico e riusabile.

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo
npm run build      # typecheck + build di produzione (in dist/)
npm run preview    # serve la build
npm test           # test dell'engine
```

## Aprirlo sull'iPhone (M0)

Serve la build su HTTPS o rete locale, poi Safari → Condividi → **Aggiungi a
Home**. Istruzioni dettagliate nella chat del milestone M0.
