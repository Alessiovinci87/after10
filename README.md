# AFTER 10

Thriller/survival mobile da ~10 minuti reali, giocato su un finto sistema
operativo. Web/PWA installabile su iPhone, giocabile offline.

## Stato: M2 — "Pianerottolo" con scene visive e storia che evolve

Il finto OS si gioca e ora **respira**. Uno **stage SVG** disegna lo spioncino —
buio, una sagoma, una torcia che scorre, un'ombra sotto la porta — mentre la
storia **avanza da sola** in momenti lungo i 10 minuti: anche stando fermo, la
tensione sale. Le azioni (**Spioncino** −8s, **Cerca in casa** −20s) rivelano il
dettaglio del momento corrente e **cambiano nel tempo**, così il contenuto non
si esaurisce. Leggere è gratis; solo le azioni e il tempo consumano secondi
(soft real-time).

A `0:00` si rivela quale delle **tre verità nascoste** (Blackout / Intrusione /
Falso allarme) stava accadendo, con la **timeline causale** (`causedBy`) che
intreccia ciò che hai osservato e ciò che è successo da solo. Batteria visibile
che cala; Sicurezza e Conoscenza restano nascoste.

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
  engine/      # TS puro: types, reducer, momenti, stato iniziale, format
  ui/          # viste: StatusBar, SceneStage (SVG), Timer, ClueLog, ActionBar, Ending
  app/         # App + ponte React<->engine (useEngine, composition root)
  scenarios/   # slice "pianerottolo": sceneggiatura, verità, finali (pura data)
  audio/  save/ # (successivi)
tests/         # test dell'engine (Vitest)
scripts/       # generatore icone PWA
```

Lo **scenario è pura data** (`src/scenarios/pianerottolo.ts`): una
sceneggiatura di *momenti* nel tempo (scena + testo ambientale + cosa rivelano
le azioni). L'engine la consulta senza conoscerne il contenuto, così resta
generico e riusabile. Le **scene** sono SVG+CSS (nessuna immagine: leggero e
offline).

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
