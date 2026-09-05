#!/usr/bin/env python3
"""Build square PWA icons from the Schokoladen photo."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "schokoladen.jpg"
PUBLIC = ROOT / "public"


def square_crop(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, (h - side) // 2 - h // 20)
    return im.crop((left, top, left + side, top + side))


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    cropped = square_crop(src)
    for name, size in (("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
        out = cropped.resize((size, size), Image.Resampling.LANCZOS)
        out.save(PUBLIC / name, "PNG", optimize=True)
    fav = cropped.resize((32, 32), Image.Resampling.LANCZOS)
    fav.save(PUBLIC / "favicon.png", "PNG", optimize=True)
    print("wrote icons")


if __name__ == "__main__":
    main()
