#!/usr/bin/env bash
# RR Clinic — hero image pipeline.
#
# Reads the original PNGs in assets-src/img/ (never modified) and writes web-ready
# versions to public/assets/img/web/. Safe to re-run: outputs are regenerated.
#
#   ./scripts/optimize-images.sh            # run from anywhere
#   QUALITY=85 ./scripts/optimize-images.sh # override WebP/JPEG quality
#
# Requirements: macOS `sips` (always present). `cwebp` (brew install webp) is
# used when available and produces .webp (alpha preserved). Without cwebp the
# script falls back to `sips` and writes .jpg (opaque) / .png (alpha) instead —
# in that case src/data/hero.json paths (which reference .webp) must be updated.
#
# Sizing rules (see docs/data-schema.md):
#   - card images (render ~166x182 CSS px, hover up to ~2x): long side <= 600
#     (interview posters: larger, see their block)
#   - case4/case7: full photos from the Figma SVG exports (see the block
#     below); hero.json `framing` places each side on its card half.
#   - case3/case6 face pairs: one side-by-side image -> split into
#     -before (left half) and -after (right half); the pair is also kept.
#   - background / statue: 2x display width capped at 2560, never upscaled.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets-src/img"
OUT="$ROOT/public/assets/img/web"
QUALITY="${QUALITY:-80}"
CARD_MAX=600
WIDE_CAP=2560

mkdir -p "$OUT"

HAS_CWEBP=0
if command -v cwebp >/dev/null 2>&1; then HAS_CWEBP=1; fi

dim()   { sips -g "$2" "$1" 2>/dev/null | awk -v k="$2" '$1==k":"{print $2}'; }
alpha() { sips -g hasAlpha "$1" 2>/dev/null | awk '$1=="hasAlpha:"{print $2}'; }

# encode <src> <out-basename> <target-w|0> <target-h|0> [crop "x y w h"]
# target 0/0 = keep size; one 0 = keep aspect.
encode() {
  local src="$1" base="$2" tw="$3" th="$4" crop="${5:-}"
  if [[ ! -f "$src" ]]; then echo "  ! missing $src" >&2; return 1; fi
  if (( HAS_CWEBP )); then
    local args=(-quiet -q "$QUALITY" -m 6 -sharp_yuv -metadata none -alpha_q 90)
    [[ -n "$crop" ]] && args+=(-crop $crop)
    if (( tw > 0 || th > 0 )); then args+=(-resize "$tw" "$th"); fi
    cwebp "${args[@]}" "$src" -o "$OUT/$base.webp"
    echo "  $base.webp"
  else
    local tmp ext fmt
    tmp="$(mktemp -t rr-img).png"
    cp "$src" "$tmp"
    if [[ -n "$crop" ]]; then
      # shellcheck disable=SC2086
      set -- $crop  # x y w h
      sips -c "$4" "$3" --cropOffset "$2" "$1" "$tmp" >/dev/null
    fi
    if (( tw > 0 && th > 0 )); then sips -z "$th" "$tw" "$tmp" >/dev/null
    elif (( tw > 0 )); then sips --resampleWidth "$tw" "$tmp" >/dev/null
    elif (( th > 0 )); then sips --resampleHeight "$th" "$tmp" >/dev/null
    fi
    if [[ "$(alpha "$tmp")" == "yes" ]]; then ext=png; fmt=png; else ext=jpg; fmt=jpeg; fi
    sips -s format "$fmt" -s formatOptions "$QUALITY" "$tmp" --out "$OUT/$base.$ext" >/dev/null
    rm -f "$tmp"
    echo "  $base.$ext (sips fallback)"
  fi
}

# Fit long side to <= max (never upscale).
fit_long() {
  local src="$1" base="$2" max="$3" w h
  w=$(dim "$src" pixelWidth); h=$(dim "$src" pixelHeight)
  if (( w <= max && h <= max )); then encode "$src" "$base" 0 0
  elif (( w >= h )); then encode "$src" "$base" "$max" 0
  else encode "$src" "$base" 0 "$max"; fi
}

# Fit width to min(display*2, cap, native).
fit_wide() {
  local src="$1" base="$2" display="$3" w target
  w=$(dim "$src" pixelWidth)
  target=$(( display * 2 )); (( target > WIDE_CAP )) && target=$WIDE_CAP
  if (( w <= target )); then encode "$src" "$base" 0 0; else encode "$src" "$base" "$target" 0; fi
}

# Split a side-by-side pair into left/right halves.
split_pair() {
  local src="$1" stem="$2" w h half
  w=$(dim "$src" pixelWidth); h=$(dim "$src" pixelHeight); half=$(( w / 2 ))
  local cw=$half ch=$h tw=0 th=0
  if (( ch > CARD_MAX || cw > CARD_MAX )); then
    if (( ch >= cw )); then th=$CARD_MAX; else tw=$CARD_MAX; fi
  fi
  encode "$src" "$stem-before" "$tw" "$th" "0 0 $half $h"
  encode "$src" "$stem-after"  "$tw" "$th" "$half 0 $half $h"
}

echo "RR Clinic image pipeline (cwebp=$HAS_CWEBP, q=$QUALITY) -> $OUT"

echo "Cards (long side <= $CARD_MAX):"
for f in case1-before case1-after; do
  fit_long "$SRC/$f.png" "$f" "$CARD_MAX"
done

echo "Interview posters (sharp on the lifted card at stage scale >1 on retina):"
# Their framing zooms in (case2 shows 62 % of the width, case5 69 %), so 600 px left them soft.
fit_long "$SRC/case2-interview.png" case2-interview 1024
fit_long "$SRC/case8-interview.png" case8-interview 1024
encode "$SRC/case5-interview.png" case5-interview 900 0

echo "Full before/after photos (case4 pair, case7 before/after):"
# Embedded PNGs of the Figma exports case{4,7}-{before,after}-figma.svg (transparent background,
# flattened onto the Figma card fill). Full photos let the slider reveal real image, no gaps;
# the per-side crop lives in hero.json `framing`. Long side sized so a card half stays >= 2x.
if (( HAS_CWEBP )); then
  cwebp -quiet -q "$QUALITY" -m 6 -sharp_yuv -metadata none -blend_alpha 0xA99784 -resize 1300 0 \
    "$SRC/case4-pair-full.png" -o "$OUT/case4-pair-full.webp" && echo "  case4-pair-full.webp"
  for f in case7-before-full case7-after-full; do
    cwebp -quiet -q "$QUALITY" -m 6 -sharp_yuv -metadata none -blend_alpha 0xD1AE95 -resize 640 0 \
      "$SRC/$f.png" -o "$OUT/$f.webp" && echo "  $f.webp"
  done
else
  echo "  ! case4/case7 full photos need cwebp (alpha flattened onto the Figma fill)" >&2
fi

echo "Face pairs (split + full pair):"
split_pair "$SRC/case3-face-pair.png" case3
split_pair "$SRC/case6-face-pair.png" case6
fit_long "$SRC/case3-face-pair.png" case3-face-pair 1000
fit_long "$SRC/case6-face-pair.png" case6-face-pair 1000

echo "Avatar:"
# Figma framing of the 18px avatar: x=.1778 y=.1204 w=.6443 h=.4322 of 1696x2528
# -> square 1093x1093 @ (301,304). 192px covers 18px..96px @2x.
encode "$SRC/avatar-savelyev.png" avatar-savelyev-face 192 192 "301 304 1093 1093"
fit_long "$SRC/avatar-savelyev.png" avatar-savelyev "$CARD_MAX"

echo "Team cut-outs (alpha kept; 296x375 card -> 750 px tall @2x):"
# Embedded PNGs of the Figma exports doctor-<id>-figma.svg (transparent background).
for id in kurmanbaev-rustam romanovskaya-tatyana musa-baurzhan temirkhanov-amir chatinyan-garik; do
  encode "$SRC/doctor-$id.png" "doctor-$id" 0 750
done

echo "Wide (2x display, cap $WIDE_CAP, no upscale):"
fit_wide "$SRC/bg-columns.png" bg-columns 1440
# trust-card = Figma "Main content container" (trust-card-figma.svg) rendered at 2x: all its layers
# (columns, founders, statue, grid, glows) flattened into one 2480x1120 photo.
QUALITY=85 fit_wide "$SRC/trust-card.png" trust-card 1240
# statue-v2 = Figma "rr-statue-cool-marble-v2" (embedded 1678×937 PNG). The hero centrepiece is
# shown upscaled on retina, so lossy artefacts read as blur: spend bytes here (q95 ≈ 95 KB).
QUALITY=95 fit_wide "$SRC/statue-v2.png" statue 1290

echo "UI sprite (dimensions kept for background-position):"
if (( HAS_CWEBP )); then
  cwebp -quiet -lossless -z 9 -metadata none "$SRC/2gis-sprite.png" -o "$OUT/2gis-sprite.webp"
  echo "  2gis-sprite.webp"
else
  encode "$SRC/2gis-sprite.png" 2gis-sprite 0 0
fi
# Hero shows only the square app icon at 26x26 CSS px -> crop left 271x271, 104px (4x).
encode "$SRC/2gis-sprite.png" 2gis-icon 104 104 "0 0 271 271"

# Summary
before=$(find "$SRC" -maxdepth 1 -name '*.png' -exec stat -f%z {} + | awk '{s+=$1} END{print s}')
after=$(find "$OUT" -maxdepth 1 -type f -exec stat -f%z {} + | awk '{s+=$1} END{print s}')
printf 'Originals: %.2f MB  ->  web: %.2f MB\n' "$(echo "$before/1048576" | bc -l)" "$(echo "$after/1048576" | bc -l)"
