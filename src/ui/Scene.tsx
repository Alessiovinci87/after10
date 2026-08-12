import { memo, useEffect, useState } from 'react';
import type { Mood, SceneId } from '@engine/index';
import { SceneStage } from './SceneStage';

/**
 * La scena visibile. Mostra l'immagine cinematografica del beat corrente (con
 * grana, vignettatura, micro-movimento) e intensifica l'atmosfera secondo
 * l'umore (calma / tensione / panico). Se l'immagine manca o non carica,
 * ripiega sullo stage vettoriale — il gioco funziona comunque.
 */
export const Scene = memo(function Scene({
  scene,
  image,
  mood,
}: {
  scene: SceneId;
  image: string | null;
  mood: Mood;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);

  if (!image || failed) {
    return (
      <div className={`scene scene--vector mood--${mood}`}>
        <SceneStage scene={scene} />
      </div>
    );
  }

  const src = `${import.meta.env.BASE_URL}scenes/${image}.webp`;
  return (
    <div className={`scene scene--photo scene--${scene} mood--${mood}`}>
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
      <div className="scene__pulse" />
    </div>
  );
});
