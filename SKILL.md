---
name: interactive-picture-book
description: Build a code-drawn, interactive children's e-picture-book as a single static web app — procedurally painted crayon/watercolour art on canvas, a realistic draggable page-curl, tappable animated characters with synthesized sound, and warm pre-generated narration (edge-tts, free, no API key). Use when asked to make a 绘本 / storybook / picture book / 电子绘本 for children, or an interactive illustrated story with page-turning.
triggers: 绘本, 电子绘本, picture book, storybook, children's book, 翻页, page turn, 睡前故事, bedtime story, interactive story for kids, 幼儿绘本
---

# Interactive Picture Book — a code-drawn, narrated, tappable storybook

Builds a complete e-picture-book that runs from a single `index.html`, fully
offline: every illustration is **drawn in code** on a `<canvas>` (no image
assets), pages turn with a **real draggable page-curl**, tapping things on each
page triggers **animations + synthesized sound**, and each page is read aloud
in a **warm, human-sounding voice** from pre-generated audio.

This skill is the end-to-end *process*. Reference implementation:
`https://github.com/YaoSiyuan43/storybook-cloud` (《小云朵回家》).

## When to use

A request for a children's storybook / 绘本 that should feel polished and
alive — not a slideshow of static images, not emoji. The child (4–6) taps,
turns pages, and hears the story. Quality bar: picture-book-grade art and a
genuinely expressive read-aloud.

## Architecture (keep this file split — it is load-bearing)

```
index.html          # shell: <canvas>, nav/toolbar, intro card, <script> order
css/style.css        # UI chrome only (nav, dots, toolbar, intro) — art is all canvas
js/core.js           # SB namespace: rng, colour, path/smooth/blob helpers, crayon
                     #   texture fill (SB.tex), paper grain, particle system (SB.FX),
                     #   static painters (sky, meadow, cloud, forest, house, water…)
js/characters.js     # SB.C.*  one function per character, animated purely by a
                     #   state object (t, run, bleat, blink, mood…). NEVER one
                     #   geometry recoloured per species — each gets real geometry.
js/audio.js          # SB.A: WebAudio synth SFX + music-box loop + narration player
js/scenes-a.js … d   # SB.DEF[i] = one spread each (bg/init/update/draw/tap/hints/text)
audio/manifest.json  # { voice, rate, pitch, lines:{ "<scene>-<line>": "文字" } }
audio/<s>-<l>.mp3    # pre-generated narration, one clip per text line
tools/gen_audio.py   # regenerates audio from the manifest via edge-tts
```

`index.html` loads core → characters → audio → scenes-a…d, then
`window.SB.SCENES = window.SB.DEF.slice()`, then book.js. **book.js is the
engine** (layout, page-curl geometry, input, text rendering, narration UI);
scenes only declare content.

### Scene contract (`SB.DEF[i]`)
```js
SB.DEF[i] = {
  name,
  bg(ctx, r),        // paint the static background to an offscreen cache (r = seeded rng)
  init(S),           // build mutable runtime state S (positions, phases, flags)
  enter(S),          // optional: reset per-visit animation (e.g. a fall/rise sequence)
  update(S, dt),     // advance animation; decay timers; spawn particles (S.fx)
  draw(ctx, S),      // draw characters/props using current S
  drawTop(ctx, S),   // optional: HUD/hints above text
  text: { x,y,size,w,align,col,halo, lines:[{t:'…'}] },   // page narration
  hover(S,x,y)->bool,            // cursor feedback over hotspots
  tap(S,x,y)->bool,              // handle a tap; return true if consumed
  hints(S)->[[x,y,'id'],…],      // untouched hotspots get sparkle + a guiding hand
};
```
Hit-tests `SB.hitCirc/hitEll/hitRect` come from book.js. Canvas is 1600×960
(two 800-wide pages). View 0 shows only the right half, the last view only the
left half — compose single-page spreads in the correct half-band.

## Build procedure

1. **Story first.** Original plot, but borrow the proven rhythm of loved picture
   books: a simple goal + a journey + helpers + gentle repetition (a thing is
   tried, fails kindly, they try another) + a warm ending. 4–6yo attention =
   ~11 spreads. Weave in 1–2 *learning* beats on existing art, never bolted-on
   pages: counting (tap N things, they call out 1·2·3), colour-naming (name a
   rainbow's colours), or a one-line life lesson the plot already shows
   ("别放弃，换个办法").
2. **Engine + helpers (core.js).** Build the crayon texture fill (`SB.tex`),
   paper grain, the particle system, and reusable painters BEFORE scenes.
3. **Characters (characters.js).** One function each, driven by a state object.
   Differentiate species with real geometry — a lamb, a duck, a bear must not
   be the same blob recoloured. (Lesson learned the hard way.)
4. **Scenes.** One spread per `SB.DEF[i]`. Give every page 3–6 tappable
   hotspots with a sound + reaction, plus `hints` so a child discovers them.
5. **Audio (see pipeline below).**
6. **Validate (see below), then open in the user's real browser** for the
   canvas/WebGL visuals — this skill's host sandbox cannot screenshot them.

## Narration pipeline — expressive, free, offline (edge-tts)

The browser's built-in `speechSynthesis` sounds robotic. Replace it with
**pre-generated MP3s** from **edge-tts** (Microsoft neural voices: free, no API
key, no GPU). Keep Web Speech as a runtime fallback.

- Warm Chinese voices: `zh-CN-XiaoxiaoNeural` (warm, narrator),
  `zh-CN-XiaoyiNeural` (lively, kid characters), `zh-CN-YunxiNeural` (sunny
  male), `zh-CN-YunxiaNeural` (cute). Slow to **~0.75× for young children**:
  narrator `--rate=-30%`, bigger/elder characters `-32%…-36%`, with a small
  pitch shift per character.
- `audio/manifest.json` maps `"<scene>-<lineIndex>" → text` (strip paired
  quotes “ ” 「 」 — they read awkwardly). `tools/gen_audio.py` reads it and
  writes one MP3 per line, caching by an md5 of voice+rate+pitch+text so only
  changed lines regenerate.
- Wire-up: `js/audio.js` `A.speak(lines)` plays `audio/<_key>.mp3` for each
  line (tagged `_key` by `book.js` `B.read`), falling back to `speechSynthesis`
  when a clip is missing. `A.stopSpeech` pauses the clip; `A.setMuted` mutes it.

```bash
python3 -m venv .ttsenv && .ttsenv/bin/pip install edge-tts
.ttsenv/bin/edge-tts --list-voices | grep zh-CN          # pick voices
.ttsenv/bin/python tools/gen_audio.py                    # generate all clips
# audition one voice/rate before committing to the whole set:
.ttsenv/bin/edge-tts --voice zh-CN-XiaoxiaoNeural --rate=-30% --pitch=+5Hz \
  --text "山坡上，住着一只小羊。" --write-media sample.mp3
```
Always generate ONE sample and let the user approve voice + speed BEFORE
rendering the full set. `.ttsenv/` is a local venv — git-ignore it.

Heavier GPU models (Fish-Speech, Chatterbox, Qwen3-TTS, IndexTTS) sound a hair
better but need a GPU and setup — overkill for a storybook. Only reach for them
if the user wants a *specific cloned* human voice.

## Validation (no headless browser in this sandbox)

Headless Chrome/Edge is unreliable here (collides with the user's running
Chrome; Edge hangs). Validate with **Node + a canvas-2d stub** instead:

- `node --check` every JS file.
- A harness that stubs `window`, a no-op 2D context, `AudioContext`, `fetch`,
  `Audio`, loads core+characters+scenes, then for every `SB.DEF[i]`: runs
  `init`→`bg`→`enter`, ~6s of `update`+`draw`, fires `tap` on every `hints`
  hotspot + a grid sweep, and runs post-tap sequences. Any thrown error = fail.
  This catches the real bugs (e.g. an argument passed into a colour slot
  reaching `hex.replace`), geometry/undefined/NaN, and dead hotspots.
- For audio: stub `fetch`→manifest and `Audio`, assert keyed lines play
  `<key>.mp3` and unkeyed lines fall back.
- Then hand the live page to the user's browser for visual/sound acceptance.

## Gotchas (paid for already)

- Mind variadic painter signatures: `P.pine(ctx,r,x,y,h,col,opts)` — passing
  `{tiers:n}` into the `col` slot crashes `SB.shade`→`hex.replace`. Always pass
  colour before options.
- Set a surface's background AND its text colour together, or dark mode breaks.
- Last-page content must live in the left 800px half (that view hides its right
  half); view-0 content in the right half.
- Keep per-frame work cheap — backgrounds are cached offscreen; only characters
  and particles redraw.
