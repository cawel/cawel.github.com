# Center-crop helper for generated story images.
# Requires Pillow: `pip install pillow`
#
# Inputs:
# - input_path: source image file path.
# - output_path: destination image file path.
# - target_width: output width in pixels (default: 1536).
# - target_height: output height in pixels (default: 864).
# - vertical_crop: used only when the source is too tall for the target ratio.
#     * top: keep top content, remove extra pixels from the bottom.
#     * bottom: keep bottom content, remove extra pixels from the top.
#     * both: remove extra pixels evenly from top and bottom (default).
#
# Example:
#   python3 scripts/image-utils/crop_to_16_9.py input.png output_1536x864.png --vertical-crop both

import argparse
from PIL import Image
from pathlib import Path
from typing import Literal

VerticalCropMode = Literal["top", "bottom", "both"]


def _compute_vertical_crop_bounds(
    source_height: int,
    cropped_height: int,
    vertical_crop: VerticalCropMode,
) -> tuple[int, int]:
    """Return (top, bottom) bounds for vertical cropping."""
    if vertical_crop == "top":
        top = 0
        bottom = cropped_height
    elif vertical_crop == "bottom":
        top = source_height - cropped_height
        bottom = source_height
    else:
        # Default "both": crop evenly from top and bottom.
        top = (source_height - cropped_height) // 2
        bottom = top + cropped_height

    return top, bottom


def crop_to_16_9(
    input_path: str | Path,
    output_path: str | Path,
    target_width: int = 1536,
    target_height: int = 864,
    vertical_crop: VerticalCropMode = "both",
) -> None:
    """
    Crop an image to exact 16:9, then resize to the requested output size.

    Horizontal crops are always centered. Vertical crops can be taken from:
    - "top": keep top area, remove from bottom
    - "bottom": keep bottom area, remove from top
    - "both": remove evenly from top and bottom (default)

    This avoids distortion because it never stretches to fit before cropping.
    """
    if vertical_crop not in {"top", "bottom", "both"}:
        raise ValueError("vertical_crop must be one of: 'top', 'bottom', 'both'")

    input_file = Path(input_path)
    output_file = Path(output_path)

    image = Image.open(input_file).convert("RGB")
    source_width, source_height = image.size

    target_aspect_ratio = target_width / target_height
    source_aspect_ratio = source_width / source_height

    if source_aspect_ratio > target_aspect_ratio:
        # Source is too wide: crop left/right
        cropped_width = int(round(source_height * target_aspect_ratio))
        left = (source_width - cropped_width) // 2
        right = left + cropped_width
        top = 0
        bottom = source_height
    else:
        # Source is too tall: crop top/bottom
        cropped_height = int(round(source_width / target_aspect_ratio))
        top, bottom = _compute_vertical_crop_bounds(
            source_height=source_height,
            cropped_height=cropped_height,
            vertical_crop=vertical_crop,
        )
        left = 0
        right = source_width

    image = image.crop((left, top, right, bottom))

    if image.size != (target_width, target_height):
        image = image.resize((target_width, target_height), Image.LANCZOS)

    image.save(output_file, format="PNG")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Crop image to 16:9 and resize without distortion."
    )
    parser.add_argument("input_path", nargs="?", default="input.png")
    parser.add_argument("output_path", nargs="?", default="output_1536x864.png")
    parser.add_argument("--width", type=int, default=1536)
    parser.add_argument("--height", type=int, default=864)
    parser.add_argument(
        "--vertical-crop",
        choices=["top", "bottom", "both"],
        default="both",
        help="When image is too tall, crop from top, bottom, or both (default).",
    )

    args = parser.parse_args()

    crop_to_16_9(
        input_path=args.input_path,
        output_path=args.output_path,
        target_width=args.width,
        target_height=args.height,
        vertical_crop=args.vertical_crop,
    )
