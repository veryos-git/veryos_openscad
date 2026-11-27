# Loop Evolve webapp

Makes animations with a local AI image generator: a random closed loop is sketched, random pixels are sprinkled around the line, SDXL-Turbo redraws the image from a prompt, and the result is the next frame's input. `loop_evolve.py` does this, the webapp runs it and shows the frames while they come. The gif is rewritten after each frame, so it can be watched and downloaded during the run.

## run

```
deno task start
```

Opens on http://localhost:8767. The first start creates `venv/` and installs the Python packages (torch is large). Without an NVIDIA GPU the CPU build of torch is installed; the model then needs minutes per frame instead of seconds. The model (several GB) downloads on the first real run and is cached by Hugging Face.

## files

| file | what |
| --- | --- |
| `loop_evolve.py` | the loop: sketch, noise, img2img, gif |
| `image_generator.py` | single image to image, for trying prompts by hand |
| `server.js` | Deno server: installs, starts runs, serves frames |
| `index.html`, `app.js` | the page |
| `runs/<id>/` | one run: `params.json`, `log.txt`, `frames/`, `animation.gif`; not in git |

## parameters

| parameter | default | effect |
| --- | --- | --- |
| prompt | a closed loop line | what the model draws each frame |
| frames | 60 | frames after the sketch |
| strength | 0.3 | how much each frame changes, 0.2 for gentle drift, 0.5 and up for drastic changes |
| steps | 4 | model steps, raised automatically so steps × strength ≥ 1 |
| noise | 200 | random pixels per frame |
| spread | 15 | max distance of the noise from the line, px |
| seed | 0 | same seed, same animation |
| fps | 8 | gif speed |
| dry run | off | skips the model, only noise, to test quickly |

One run at a time, since the model needs the whole GPU or CPU.
