// Shape of src/data/hero.json (see docs/data-schema.md). Image paths are relative to /public.

export interface Framing {
  /** Normalised crop of the source image shown in Figma (0–1). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageAsset {
  src: string;
  width: number;
  height: number;
  framing?: Framing;
  alt?: string;
}

export interface PairImage {
  src: string;
  width: number;
  height: number;
  before: Framing;
  after: Framing;
}

export interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  specialty: string;
  photo: ImageAsset | null;
  avatar: ImageAsset | null;
  city: string;
  href: string;
  figmaNodeId?: string;
}

interface CaseBase {
  id: string;
  title: string;
  caption: string | null;
  showTitle: boolean;
  doctorId: string;
  behindStatue?: boolean;
  featured?: boolean;
  figmaNodeId?: string;
}

export interface BeforeAfterCase extends CaseBase {
  type: 'beforeAfter';
  before: ImageAsset;
  after: ImageAsset;
  pair?: PairImage;
}

export interface VideoSource {
  src: string;
  type: string;
  duration?: number;
  captions?: string;
}

export interface VideoCase extends CaseBase {
  type: 'video';
  poster: ImageAsset;
  /** null until the client supplies footage — render poster only, no playback. */
  video: VideoSource | null;
}

export type Case = BeforeAfterCase | VideoCase;

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface Cta {
  id: 'pick-specialist' | 'see-works' | string;
  label: string;
  href: string;
  variant: 'primary' | 'secondary';
  icon: string | null;
}

export interface HeroData {
  _meta: { schemaVersion: number | string; updated: string; source: string; imageRoot: string; notes: string[] | string };
  clinic: {
    name: string;
    location: string;
    phone: string;
    phoneHref: string;
    whatsappHref: string;
    rating: {
      source: string;
      value: number;
      max: number;
      count: number;
      logo: ImageAsset;
      url: string | null;
      wordmark: ImageAsset;
    };
  };
  nav: NavLink[];
  hero: {
    title: string;
    subtitle: string;
    ctas: Cta[];
    background: ImageAsset;
    statue: ImageAsset;
  };
  doctors: Doctor[];
  cases: Case[];
}
