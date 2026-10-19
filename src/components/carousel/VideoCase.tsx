// Interview (video) card (§4.3). The <video> is created lazily on the first activation (hover /
// focus of the lifted card) — muted, playsinline, loop — and paused + rewound when it ends.
// All current `video` fields are null → poster + play icon only, no playback.
import { useEffect, useRef, useState } from 'react';
import { asset } from '../../data/hero';
import type { Case, ImageAsset, VideoCase as VideoCaseData } from '../../data/types';
import { T, framingStyle, videoSource } from './geometry';

interface Props {
  item: VideoCaseData;
  eager: boolean;
  /** True while this media is the visible content of an "on" lift. */
  active?: boolean;
  reducedMotion?: boolean;
}

function Poster({ image, alt, eager }: { image: ImageAsset; alt: string; eager: boolean }) {
  return (
    <img
      src={asset(image.src)}
      width={image.width}
      height={image.height}
      alt={image.alt ?? alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={image.framing ? 'absolute max-w-none object-cover' : 'absolute inset-0 size-full max-w-none object-cover'}
      style={framingStyle(image.framing)}
    />
  );
}

export function VideoCase({ item, eager, active = false, reducedMotion = false }: Props) {
  const source = videoSource(item);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [requested, setRequested] = useState(false); // lazy: no <video>/src before the first activation
  const [playing, setPlaying] = useState(false);

  const src = source?.src ?? null;

  useEffect(() => {
    if (!src) return;
    if (!active) {
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
          if (video.readyState > 0) video.currentTime = 0;
        } catch {
          /* not loaded yet */
        }
      }
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (video) video.play().catch(() => setPlaying(false)); // refused / interrupted: keep the poster
      else setRequested(true); // first activation: mount the element (src attached only now)
    }, reducedMotion ? 0 : T.video);
    return () => clearTimeout(timer);
  }, [active, src, reducedMotion]);

  // First activation: the element mounts after `requested` flips — start it here.
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    if (requested && activeRef.current) videoRef.current?.play().catch(() => setPlaying(false));
  }, [requested]);

  const posterAlt = item.caption ? `${item.caption}. ${item.title}` : item.title;

  return (
    <div
      className="cc-vid absolute inset-0 overflow-hidden bg-[#4a3624] font-text text-white"
      data-playing={playing ? '' : undefined}
      data-has-video={source ? 'true' : 'false'}
    >
      {item.poster && <Poster image={item.poster} alt={posterAlt} eager={eager} />}
      {source && requested && (
        <video
          ref={videoRef}
          className="cc-vid__video absolute inset-0 size-full object-cover"
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          poster={item.poster ? asset(item.poster.src) : undefined}
          onPlaying={() => setPlaying(active)}
        >
          <source src={asset(source.src)} type={source.type} />
        </video>
      )}
      <div className="cc-shade-top" aria-hidden="true" />
      <div className="cc-shade-bottom" aria-hidden="true" />
      {item.showTitle && (
        <p className="pointer-events-none absolute inset-x-4 top-4 m-0 line-clamp-2 text-[12.5px]/[14px] text-white">{item.title}</p>
      )}
      <img
        src={asset('assets/icons/play-circle.svg')}
        alt=""
        width={22}
        height={22}
        draggable={false}
        aria-hidden="true"
        className="cc-vid__play pointer-events-none absolute bottom-[46px] left-4 size-[22px]"
      />
      {item.caption && (
        <p className="pointer-events-none absolute inset-x-4 bottom-4 m-0 line-clamp-2 text-[13px]/[14px] text-white">{item.caption}</p>
      )}
    </div>
  );
}

/** Fallback for a case without usable media pair. */
export function PosterOnly({ item, eager }: { item: Case; eager: boolean }) {
  const image = item.type === 'video' ? item.poster : (item.after ?? item.before);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#4a3624] font-text text-white">
      {image && <Poster image={image} alt={item.title} eager={eager} />}
      <div className="cc-shade-bottom" aria-hidden="true" />
      {item.showTitle && (
        <p className="pointer-events-none absolute inset-x-4 bottom-4 m-0 line-clamp-2 text-[12px]/[14px] text-white">{item.title}</p>
      )}
    </div>
  );
}
