// StPageFlip ships no type declarations; this covers the parts the album uses.
declare module "page-flip" {
  export interface FlipSetting {
    startPage: number;
    size: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }
  export type FlippingState = "user_fold" | "fold_corner" | "flipping" | "read";
  export class PageFlip {
    constructor(parent: HTMLElement, settings: Partial<FlipSetting>);
    loadFromHTML(items: HTMLElement[]): void;
    update(): void;
    destroy(): void;
    flip(page: number): void;
    flipNext(): void;
    flipPrev(): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getState(): FlippingState;
    getUI(): object;
    getSettings(): FlipSetting;
    getOrientation(): "portrait" | "landscape";
    on(event: "flip", cb: (e: { data: number }) => void): this;
    on(event: "changeState", cb: (e: { data: FlippingState }) => void): this;
    on(event: "changeOrientation", cb: (e: { data: "portrait" | "landscape" }) => void): this;
  }
}
