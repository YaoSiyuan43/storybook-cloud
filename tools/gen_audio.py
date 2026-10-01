#!/usr/bin/env python3
"""Generate narration MP3s for the picture book from audio/manifest.json using edge-tts.

Usage:
    python3 tools/gen_audio.py                 # generate all missing/changed clips
    python3 tools/gen_audio.py --force         # regenerate every clip

Requires: pip install edge-tts   (free, no API key, Microsoft neural voices)
Each line -> audio/<scene>-<line>.mp3 . A warm, slowed voice (~0.75x) suits kindergarten listeners.
"""
import asyncio, json, sys, hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "audio"
MANIFEST = AUDIO / "manifest.json"

def main():
    import edge_tts  # noqa
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    voice = data["voice"]; rate = data.get("rate", "-30%"); pitch = data.get("pitch", "+5Hz")
    force = "--force" in sys.argv
    lines = data["lines"]
    # cache file records text+params so we only regenerate what changed
    cache_path = AUDIO / ".gen_cache.json"
    cache = {}
    if cache_path.exists() and not force:
        try: cache = json.loads(cache_path.read_text())
        except Exception: cache = {}

    async def run():
        made = 0
        for key, text in lines.items():
            out = AUDIO / f"{key}.mp3"
            sig = hashlib.md5(f"{voice}|{rate}|{pitch}|{text}".encode()).hexdigest()
            if out.exists() and cache.get(key) == sig and not force:
                continue
            com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await com.save(str(out))
            cache[key] = sig; made += 1
            print(f"  ✓ {key}.mp3  {text}")
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2))
        print(f"\nDone. {made} clip(s) generated, {len(lines)} total in {AUDIO}")

    asyncio.run(run())

if __name__ == "__main__":
    try:
        main()
    except ImportError:
        sys.exit("edge-tts not installed. Run:  pip install edge-tts")
