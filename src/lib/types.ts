export type ImageFolder =
  | "cover"
  | "couple"
  | "album"
  | "portraits"
  | "family"
  | "details";

/** A single photograph. `src` is undefined until a real file exists on disk. */
export interface Photo {
  /** Stable id. Also the file name (without extension) in public/images/<folder>/ */
  id: string;
  folder: ImageFolder;
  /** Resolved automatically from the image manifest. Undefined => placeholder frame. */
  src?: string;
  width?: number;
  height?: number;
  alt: string;
  caption?: string;
  date?: string;
  /** Used for placeholder frames and layout before the real file is added. */
  aspect: number;
  /** Focal point for cropping, CSS object-position, e.g. "50% 30%". Keep faces in frame. */
  focus?: string;
  /** Set true only if guests may download the original. */
  downloadable?: boolean;
}

export type SpreadLayout =
  | "chapter-opening"
  | "full-page"
  | "two-image"
  | "three-collage"
  | "full-bleed"
  | "portrait-caption"
  | "candid-collage"
  | "closing";

export interface Spread {
  id: string;
  layout: SpreadLayout;
  heading?: string;
  caption?: string;
  images: Photo[];
}

export interface Chapter {
  id: string;
  title: string;
  introduction: string;
  spreads: Spread[];
}

export interface TimelineEntry {
  id: string;
  title: string;
  date?: string;
  location?: string;
  description: string;
  image?: Photo;
}

export interface NavItem {
  /** DOM id of the section this link scrolls to. */
  id: string;
  label: string;
}

export interface SiteConfig {
  names: [string, string];
  /** ISO date of the wedding. */
  weddingDate: string;
  weddingDateDisplay: string;
  weddingDateShort: string;
  location: string;
  siteTitle: string;
  description: string;
  tagline: string;
  openingLine: string;
  closingLine: string;
  /** Set NEXT_PUBLIC_SITE_URL in the environment once the deployment URL is known. */
  siteUrl: string;
  /** Optional. Place a file at public/audio/ and set the path here. */
  music?: { src: string; title: string };
  /** Chapter ids shown in the "Selected memories" section, in order. */
  memoryChapterIds: string[];
  /** Chapter shown in the "Family & Friends" gallery. Remove the chapter and the section disappears. */
  familyChapterId: string;
  /** Header navigation, in order. `id` must match a section id on the page. */
  nav: NavItem[];
  /**
   * Master switch for the download button in the photo viewer. Off by default: turn it on only
   * when you are happy for visitors to keep full-size copies. Individual photos can override it.
   */
  allowDownloads: boolean;
}

export interface AlbumPage {
  key: string;
  node: React.ReactNode;
}
