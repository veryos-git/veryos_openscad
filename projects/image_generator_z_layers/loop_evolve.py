"""
Evolving closed-loop line: sketch -> add noise near the line -> img2img -> repeat.
Every frame is saved, and an animated GIF is built at the end.

Install once:
    pip install torch diffusers transformers accelerate pillow numpy

Usage:
    python loop_evolve.py                      # 60 frames, defaults
    python loop_evolve.py -n 120 -s 0.4 --noise 800 --seed 7
    python loop_evolve.py --dry-run            # test the pipeline without the AI model

Output: frames/frame_0000.png ... and loop_animation.gif, which is rewritten after each frame
"""
import argparse
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw

SIZE = 256


# ---------- 1. initial sketch: a random smooth closed loop ----------
def make_loop_sketch(rng, size=SIZE, width=6):
    """Random blob made from a few Fourier terms, so it is always closed."""
    img = Image.new("RGB", (size, size), "white")
    draw = ImageDraw.Draw(img)
    cx = cy = size / 2
    base = size * 0.28
    terms = [(k, rng.uniform(0, base * 0.25 / k), rng.uniform(0, 2 * math.pi))
             for k in range(2, 6)]
    pts = []
    for i in range(400):
        t = 2 * math.pi * i / 400
        r = base + sum(a * math.sin(k * t + ph) for k, a, ph in terms)
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
    pts.append(pts[0])  # close the loop
    draw.line(pts, fill="black", width=width, joint="curve")
    return img


# ---------- 2. sprinkle random pixels around the line ----------
def add_noise_near_line(img, rng, n_pixels=500, spread=25, threshold=110):
    arr = np.array(img).copy()
    gray = arr.mean(axis=2)
    ys, xs = np.nonzero(gray < threshold)          # "line" = dark pixels
    h, w = gray.shape
    if len(xs) == 0:                                # no line found -> anywhere
        xs, ys = np.array([w // 2]), np.array([h // 2])
        spread = w // 2
    idx = rng.integers(0, len(xs), n_pixels)
    nx = np.clip(xs[idx] + rng.integers(-spread, spread + 1, n_pixels), 0, w - 1)
    ny = np.clip(ys[idx] + rng.integers(-spread, spread + 1, n_pixels), 0, h - 1)
    # mix of dark dots and random colours
    colours = rng.integers(0, 256, (n_pixels, 3))
    dark = rng.random(n_pixels) < 0.6
    colours[dark] = rng.integers(0, 60, (dark.sum(), 1))
    # 2x2 dots so they survive the model's downsampling
    for dy in (0, 1):
        for dx in (0, 1):
            arr[np.clip(ny + dy, 0, h - 1), np.clip(nx + dx, 0, w - 1)] = colours
    return Image.fromarray(arr)


# ---------- 3. the model ----------
def load_pipeline():
    import torch
    from diffusers import AutoPipelineForImage2Image

    if torch.cuda.is_available():
        device, dtype = "cuda", torch.float16
    elif torch.backends.mps.is_available():
        device, dtype = "mps", torch.float16
    else:
        device, dtype = "cpu", torch.float32
    print(f"Using {device}")
    pipe = AutoPipelineForImage2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=dtype,
        variant="fp16" if dtype == torch.float16 else None,
    ).to(device)
    pipe.set_progress_bar_config(disable=True)
    return pipe


def generate(pipe, img, prompt, strength, steps, seed):
    import torch

    steps = max(steps, math.ceil(1 / strength))     # Turbo needs steps*strength >= 1
    return pipe(
        prompt=prompt,
        image=img,
        strength=strength,
        num_inference_steps=steps,
        guidance_scale=0.0,
        generator=torch.Generator("cpu").manual_seed(seed),
    ).images[0].resize((SIZE, SIZE))


# ---------- 4. main loop ----------
def main():
    p = argparse.ArgumentParser()
    p.add_argument("-n", "--frames", type=int, default=60)
    p.add_argument("-p", "--prompt", default="a closed loop line")
    p.add_argument("-s", "--strength", type=float, default=0.3,
                   help="how much each step changes the image (0.2-0.8)")
    p.add_argument("--steps", type=int, default=4)
    p.add_argument("--noise", type=int, default=200, help="random pixels per frame")
    p.add_argument("--spread", type=int, default=15, help="max px distance from line")
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--fps", type=int, default=8)
    p.add_argument("--out-dir", default="frames")
    p.add_argument("--gif", default="loop_animation.gif")
    p.add_argument("--dry-run", action="store_true",
                   help="skip the AI model (only noise) to test quickly")
    args = p.parse_args()

    random.seed(args.seed)
    rng = np.random.default_rng(args.seed)
    os.makedirs(args.out_dir, exist_ok=True)

    pipe = None if args.dry_run else load_pipeline()

    img = make_loop_sketch(random.Random(args.seed))
    img.save(os.path.join(args.out_dir, "frame_0000.png"))
    frames = [img]

    for i in range(1, args.frames + 1):
        noisy = add_noise_near_line(img, rng, args.noise, args.spread)
        if pipe is None:
            img = noisy
        else:
            img = generate(pipe, noisy, args.prompt, args.strength,
                           args.steps, args.seed + i)
        img.save(os.path.join(args.out_dir, f"frame_{i:04d}.png"))
        frames.append(img)
        print(f"frame {i}/{args.frames}")
        # the gif is rewritten while the run goes, so the frames so far can be watched;
        # less often for long runs, since every rewrite takes all frames
        if i % max(1, i // 100) == 0 or i == args.frames:
            save_gif(frames, args.gif, args.fps)
    print(f"Saved {args.gif} ({len(frames)} frames)")


def save_gif(frames, path, fps):
    tmp = path + ".tmp"
    frames[0].save(tmp, format="GIF", save_all=True, append_images=frames[1:],
                   duration=int(1000 / fps), loop=0)
    os.replace(tmp, path)           # never a half-written gif for the viewer


if __name__ == "__main__":
    main()
