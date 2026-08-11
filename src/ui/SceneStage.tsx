import { memo } from 'react';
import type { SceneId } from '@engine/index';

/**
 * Lo stage visivo: guardi il pianerottolo come attraverso lo spioncino.
 * Tutto è SVG + CSS (nessuna immagine, resta leggero e offline). La scena
 * segue i momenti della storia: buio, una sagoma, una torcia che scorre,
 * un'ombra sotto la porta.
 *
 * Memoizzato: dipende solo da `scene`, così i tick del timer non lo
 * ridisegnano (le animazioni sono CSS e vanno avanti da sole).
 */
export const SceneStage = memo(function SceneStage({ scene }: { scene: SceneId }) {
  return (
    <div className={`stage stage--${scene}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="stage__svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="peep" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1b1b20" />
            <stop offset="70%" stopColor="#050506" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="warm" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#2a2620" />
            <stop offset="70%" stopColor="#0a0908" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <radialGradient id="torchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7de" />
            <stop offset="40%" stopColor="#c9a24f" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <clipPath id="lens">
            <circle cx="100" cy="100" r="92" />
          </clipPath>
        </defs>

        <g clipPath="url(#lens)">
          {/* Fondale: caldo se calmo, freddo/nero se buio o teso */}
          <rect
            x="0"
            y="0"
            width="200"
            height="200"
            fill={scene === 'calm' || scene === 'idle' ? 'url(#warm)' : 'url(#peep)'}
          />

          {/* Cornice della porta di fronte, appena leggibile */}
          <g className="stage__frame" stroke="#26262c" strokeWidth="1.5" fill="none">
            <rect x="62" y="34" width="76" height="150" rx="2" />
            <line x1="128" y1="112" x2="132" y2="112" />
          </g>

          {/* Ombra sotto la porta (scena 'door') */}
          <rect className="stage__underdoor" x="62" y="176" width="76" height="8" fill="#000" />
          <g className="stage__feet">
            <ellipse cx="88" cy="181" rx="7" ry="2.4" fill="#000" />
            <ellipse cx="112" cy="181" rx="7" ry="2.4" fill="#000" />
          </g>

          {/* Sagoma umana (scena 'figure') */}
          <g className="stage__figure">
            <ellipse cx="100" cy="70" rx="15" ry="17" fill="#000" />
            <path d="M78 190 C80 128 120 128 122 190 Z" fill="#000" />
          </g>

          {/* Fascio della torcia (scena 'torch') */}
          <g className="stage__torch">
            <circle cx="100" cy="100" r="34" fill="url(#torchGlow)" />
            <circle cx="100" cy="100" r="6" fill="#fff7de" />
          </g>

          {/* Grana / vignettatura della lente */}
          <circle cx="100" cy="100" r="92" fill="none" stroke="#000" strokeWidth="16" opacity="0.55" />
        </g>

        {/* Anello dello spioncino */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="#141418" strokeWidth="6" />
      </svg>
    </div>
  );
});
