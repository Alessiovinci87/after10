# AFTER 10

Thriller/survival mobile da ~10 minuti reali, giocato su un finto sistema
operativo. Web/PWA installabile su iPhone, giocabile offline.

## Stato: M0 — guscio del finto OS

Schermo nero con status bar (`22:41 · batteria 63% · rete debole · porta chiusa`)
e un timer `10:00` che scorre davvero fino a `0:00`. Nessuna interazione ancora:
solo il tempo che passa.

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
  ui/          # componenti-vista (StatusBar, Timer) + styles
  app/         # App + ponte React<->engine (useEngine)
  scenarios/   # (slice "pianerottolo" nei milestone successivi)
  audio/  save/ # (successivi)
tests/         # test dell'engine (Vitest)
scripts/       # generatore icone PWA
```

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
