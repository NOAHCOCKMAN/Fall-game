# Life Story video

A JibJab-style animated "life story": a real face cut out of a photo on a cartoon body, from little kid to cardiologist, in 15 scenes (about 97 seconds, 1920x1080) with synthesized music and sound effects.

## Make it

1. Put two photos in `photos/`: `nohat.jpg` (no hat, facing the camera) and `hat.jpg` (wearing the Patagonia hat).
2. Set his name, and optionally the hat color, in `config.json`.
3. Build:
   ```
   pip install pillow opencv-python-headless   # OpenCV finds the face automatically
   python3 make_faces.py    # crops oval, soft-edged face cutouts into faces/
   python3 build.py         # writes life-story.html (one self-contained file)
   node export.js           # writes out/life-story-1080p.mp4 and out/life-story-text.mp4 (720p, small enough to text)
   ```
   If the face detector picks the wrong spot, give the box by hand (left, top, width, height of the face, brow to chin, in photo pixels):
   `python3 make_faces.py --nohat-box 410,300,380,420 --hat-box 380,350,360,400`.
   With no photos present, `make_faces.py` draws cartoon stand-in faces.

`life-story.html` auto-plays, with Restart and sound buttons. Browsers block sound until the first click.

## How it's built

- `src/01_core.js`: drawing helpers, the photo-head character (`drawGuy`), cartoon people (`drawToon`), the yarmulke (drawn as its own layer, separate from the face), caps and props.
- `src/02_audio.js`: Web Audio instruments, sound effects and the tune. The same score plays live and renders offline for the MP4.
- `src/03_scenes.js`: the 15 scenes. Each one has a duration, a caption, sound cues and a `draw(ctx, t)` function.
- `src/04_main.js`: timeline, transitions (page flip, wipes, iris, star, heart, blinds, spin), playback and the export hooks.

Every frame is a pure function of time (`renderAt(t)`), so `export.js` steps through it frame by frame. The video never depends on real-time playback speed.

Photos, cutouts, the built page and the videos are git-ignored, so nobody's face ends up in this public repo.
