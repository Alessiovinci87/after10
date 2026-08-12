import { memo, useEffect, useState } from 'react';
import type { SceneId } from '@engine/index';
import { SceneStage } from './SceneStage';

/**
 * La scena visibile. Se il momento corrente ha un'immagine cinematografica in
 * public/scenes/ la mostra a tutto schermo (con grana, vignettatura e micro
 * movimento); se il file non c'è o non carica, ripiega sullo stage vettoriale.
 * Così il gioco funziona anche senza immagini e si "illumina" appena le aggiungi.
 */
export const Scene = memo(function Scene({
  scene,
  image,
}: {
  scene: SceneId;
  image?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Se cambia l'immagine da mostrare, ridiamo una possibilità al caricamento.
  useEffect(() => setFailed(false), [image]);

  if (!image || failed) {
    return (
      <div className="scene scene--vector">
        <SceneStage scene={scene} />
      </div>
    );
  }

  const src = `${import.meta.env.BASE_URL}scenes/${image}.webp`;
  return (
    <div className={`scene scene--photo scene--${scene}`}>
      <img
        key={image}
        className="scene__img"
        src={src}
        alt=""
        decoding="async"
        onError={() => setFailed(true)}
      />
      <div className="scene__grain" />
      <div className="scene__vignette" />
    </div>
  );
});
