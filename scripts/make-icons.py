#!/usr/bin/env python3
"""Write simple PNG app icons without third-party deps."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"


def pixel(x: int, y: int, size: int) -> tuple[int, int, int]:
    nx, ny = x / (size - 1), y / (size - 1)
    bg = (20, 16, 13)
    gold = (227, 181, 106)
    cream = (243, 234, 214)

    # rounded-rect mask
    r = 0.18
    px, py = nx * 2 - 1, ny * 2 - 1
    ax, ay = abs(px), abs(py)
    if ax > 1 - r and ay > 1 - r:
        if (ax - (1 - r)) ** 2 + (ay - (1 - r)) ** 2 > r * r:
            return (0, 0, 0)

    # fretboard rectangle
    if 0.18 < nx < 0.82 and 0.32 < ny < 0.72:
        # strings
        for s in (0.38, 0.5, 0.62):
            if abs(ny - s) < 0.012:
                return (140, 110, 80)
        # dots
        dots = [(0.34, 0.5, 0.055, gold), (0.52, 0.38, 0.04, cream), (0.66, 0.62, 0.04, cream)]
        for dx, dy, rad, color in dots:
            if (nx - dx) ** 2 + (ny - dy) ** 2 <= rad * rad:
                return color
        return (58, 36, 24)
    return bg


def write_png(path: Path, size: int) -> None:
    raw = b"".join(
        b"\x00" + b"".join(struct.pack("BBB", *pixel(x, y, size)) for x in range(size)) for y in range(size)
    )
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def main() -> None:
    ROOT.mkdir(exist_ok=True)
    write_png(ROOT / "apple-touch-icon.png", 180)
    write_png(ROOT / "icon-192.png", 192)
    write_png(ROOT / "icon-512.png", 512)
    print("wrote icons")


if __name__ == "__main__":
    main()
