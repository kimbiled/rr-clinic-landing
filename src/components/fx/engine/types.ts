export interface LightRenderOptions {
  /** Reduced motion: no glint, the caller passes t = 0 for mid-opacity values. */
  still?: boolean;
}

export interface LightRenderer {
  readonly kind: 'webgl' | 'canvas2d';
  readonly canvas: HTMLCanvasElement;
  /**
   * @param w layout width in stage px (canvas clientWidth, untransformed)
   * @param h layout height in stage px
   * @param pxPerUnit backing-store pixels per stage px
   */
  resize(w: number, h: number, pxPerUnit: number): void;
  /** t: FX clock in seconds. */
  render(t: number, opts?: LightRenderOptions): void;
  destroy(): void;
}
