#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image


SPRITE_NAMES = [
    "greens_1",
    "tomato_1",
    "egg_1",
    "wheat_1",
    "daisy_1",
    "rose_1",
    "box_1",
    "ribbon_1",
]


def split_atlas(source_path: Path, output_dir: Path, size: int) -> None:
    source = Image.open(source_path).convert("RGBA")
    output_dir.mkdir(parents=True, exist_ok=True)
    columns, rows = 4, 2

    for index, name in enumerate(SPRITE_NAMES):
        column = index % columns
        row = index // columns
        left = round(column * source.width / columns)
        right = round((column + 1) * source.width / columns)
        top = round(row * source.height / rows)
        bottom = round((row + 1) * source.height / rows)
        cell = source.crop((left, top, right, bottom))
        alpha_box = cell.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"{name} cell has no opaque pixels")

        padding = max(4, round(max(alpha_box[2] - alpha_box[0], alpha_box[3] - alpha_box[1]) * 0.06))
        content_box = (
            max(0, alpha_box[0] - padding),
            max(0, alpha_box[1] - padding),
            min(cell.width, alpha_box[2] + padding),
            min(cell.height, alpha_box[3] + padding),
        )
        content = cell.crop(content_box)
        content.thumbnail((size - 12, size - 12), Image.Resampling.LANCZOS)
        sprite = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        sprite.alpha_composite(content, ((size - content.width) // 2, (size - content.height) // 2))
        sprite.save(output_dir / f"{name}.png", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Split the 4x2 base-material atlas into Cocos sprites.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--size", type=int, default=128)
    args = parser.parse_args()
    split_atlas(args.input, args.output_dir, args.size)
    print(f"Wrote {len(SPRITE_NAMES)} sprites to {args.output_dir}")


if __name__ == "__main__":
    main()
