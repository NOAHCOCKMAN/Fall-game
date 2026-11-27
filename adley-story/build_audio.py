#!/usr/bin/env python3
"""Voices + timeline for the Elijah movie.

Reads script.py, speaks every line with Piper neural TTS (offline), processes each voice with ffmpeg,
fits song lyrics to the beat, layers choir and crowd reactions, and writes:
  build/voice.wav      the full dialogue/vocal/crowd track (mono 44.1 kHz)
  build/voice.ogg      the same, compressed, for the web page
  build/timeline.json  scene starts/lengths, every named cue time, every line (with a mouth envelope), song lyric timings
Voice models live in VOICE_DIR (default: ./voices). Clips are cached in build/cache.
"""
import hashlib, json, os, subprocess, sys, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig
from script import SCENES

R = os.path.dirname(os.path.abspath(__file__))
VD = os.environ.get('VOICE_DIR', os.path.join(R, 'voices'))
B = os.path.join(R, 'build'); CACHE = os.path.join(B, 'cache'); os.makedirs(CACHE, exist_ok=True)
SR = 44100
PAUSE_K = .72  # tighten every between-line pause
LT = 'en-us-libritts-high'

# who: (model, speaker, semitones, length_scale, effect)
K = 'kokoro'  # Kokoro neural TTS (natural voices); speaker = Kokoro voice name, length_scale = 1/speed
VOICES = {
    'N':       (K, 'am_michael', 0, .9, 'narrator'),
    'adley':   (K, 'af_sky', 4, .95, 'dry'),
    'lilah':   (K, 'af_heart', 0, 1.0, 'dry'),
    'noah':    (K, 'am_liam', 0, 1.1, 'dry'),
}
CHOIR = [(K, 'af_heart', 0), (K, 'af_bella', 2), (K, 'af_sarah', 0), (K, 'am_michael', -3), (K, 'am_adam', -2), (K, 'am_eric', -4)]
FX = {
    'narrator': 'highpass=f=70,equalizer=f=160:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=150',
    'dry': 'highpass=f=80,equalizer=f=3000:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5',
    'evil': 'aecho=0.8:0.6:60|120:0.35|0.25',
    'choir': 'aecho=0.8:0.75:70|140|260:0.45|0.32|0.22',
    'sing': 'aecho=0.8:0.6:90|180:0.3|0.18',
    'ballad': 'aecho=0.8:0.7:120|240|400:0.35|0.25|0.15',
    'crowd': 'lowpass=f=3500,aecho=0.8:0.6:50|110:0.3|0.2',
}
_models = {}
_kok = []


def kokoro():
    if not _kok:
        from kokoro_onnx import Kokoro
        kd = os.environ.get('KOKORO_DIR', os.path.join(R, 'voices'))
        _kok.append(Kokoro(os.path.join(kd, 'kokoro-v1.0.onnx'), os.path.join(kd, 'voices-v1.0.bin')))
    return _kok[0]


def model(name):
    if name not in _models: _models[name] = PiperVoice.load(os.path.join(VD, name + '.onnx'))
    return _models[name]


def read_wav(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2: a = a.reshape(-1, 2).mean(1)
        return a, w.getframerate()


def tts(text, mdl, spk, semis, scale, fx, tempo=1.0, tag=''):
    """Speak one line and return float32 mono at SR. Cached."""
    ns = (.45, .6) if fx == 'narrator' else (.6, .75)
    key = hashlib.md5(repr((text, mdl, spk, semis, scale, FX[fx], ns, round(tempo, 3), tag, 3)).encode()).hexdigest()[:16]
    out = os.path.join(CACHE, key + '.wav')
    if not os.path.exists(out):
        raw = os.path.join(CACHE, key + '_raw.wav')
        if mdl == K:
            a, sr = kokoro().create(text, voice=spk, speed=1 / scale, lang='en-gb' if spk.startswith('b') else 'en-us')
            with wave.open(raw, 'wb') as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())
        else:
            v = model(mdl); cfg = SynthesisConfig(speaker_id=spk, length_scale=scale, noise_scale=ns[0], noise_w_scale=ns[1])
            with wave.open(raw, 'wb') as w:
                v.synthesize_wav(text, w, syn_config=cfg)
        chain = []
        if abs(semis) > .01: chain.append(f'rubberband=pitch={2 ** (semis / 12):.4f}:formant=preserved')
        t = tempo
        while t > 2.0: chain.append('atempo=2.0'); t /= 2
        while t < .5: chain.append('atempo=0.5'); t /= .5
        if abs(t - 1) > .005: chain.append(f'atempo={t:.4f}')
        chain.append(FX[fx]); chain.append(f'aresample={SR}')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', ','.join(chain), '-ac', '1', out], check=True)
        os.remove(raw)
    a, sr = read_wav(out)
    # trim silence at both ends
    nz = np.where(np.abs(a) > .01)[0]
    if len(nz): a = a[max(0, nz[0] - 200): nz[-1] + 2000]
    return a


SPOKEN = [(r"\bAvaley's\b", "Av-uh-lee's"), (r"\bAvaley\b", "Av-uh-lee")]  # how names are said (subtitles keep the spelling)


def spoken(text):
    import re
    for a, b in SPOKEN: text = re.sub(a, b, text)
    return text


def say(who, text, tempo=1.0):
    mdl, spk, semis, scale, fx = VOICES[who]
    return tts(spoken(text), mdl, spk, semis, scale, fx, tempo)


def envelope(a, fps=30):
    n = int(len(a) / SR * fps) + 1; hop = SR // fps
    e = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(a) else 0 for i in range(n)])
    e = np.clip((e - .01) / (np.percentile(e, 90) + 1e-6), 0, 1)
    return [round(float(x), 2) for x in e]


def fit(clip_fn, slot):
    """Speak with tempo adjusted so the clip fits the slot (only ever speeds up)."""
    a = clip_fn(1.0); d = len(a) / SR
    if d > slot: a = clip_fn(d / slot)
    return a


def choir_line(text, slot):
    parts = []
    for i, (mdl, spk, semis) in enumerate(CHOIR):
        a = fit(lambda t: tts(text, mdl, spk, semis, 1.0, 'choir', t, 'choir'), slot * .94)
        parts.append((int(i * .012 * SR), a * (.9 if i < 2 else .7)))
    n = max(o + len(a) for o, a in parts); mix = np.zeros(n, np.float32)
    for o, a in parts: mix[o:o + len(a)] += a
    return mix / len(parts) * 2.2


def crowd(kind, dur=None):
    rng = np.random.default_rng(hash(kind) % 1000)
    if kind == 'applause':
        n = int((dur or 3) * SR); out = np.zeros(n, np.float32)
        for _ in range(int(55 * (dur or 3))):
            t = int(rng.uniform(0, n - 3000)); L = int(rng.uniform(300, 900))
            burst = rng.normal(0, 1, L).astype(np.float32) * np.exp(-np.linspace(0, 6, L)).astype(np.float32)
            burst = np.convolve(burst, [1, -0.6], 'same'); out[t:t + L] += burst * rng.uniform(.15, .4)
        fade = np.ones(n, np.float32); k = int(.6 * SR); fade[-k:] = np.linspace(1, 0, k); fade[:int(.15 * SR)] = np.linspace(0, 1, int(.15 * SR))
        return out * fade * .55
    lines = {'laugh': ['Ha ha ha ha!', 'Ha ha ha ha ha!', 'Hah! Ha ha ha!', 'Ha ha ha!'], 'aww': ['Awwww.', 'Aww, no.', 'Awwwww.'],
             'ooh': ['Ooooh.', 'Ooooooh!', 'Ohhhh.'], 'hallelujah': ['Hallelujah!', 'Hallelujah!', 'Amen!'], 'cheer': ['Yeah!', 'Woo!', 'Yeah! Woo hoo!', 'Whoo!']}[kind]
    spks = ['af_heart', 'am_michael', 'af_bella', 'am_adam', 'af_sarah', 'am_eric', 'af_nova', 'am_liam', 'af_sky', 'am_fenrir', 'af_river', 'am_echo']
    parts = []
    for i, spk in enumerate(spks):
        a = tts(lines[i % len(lines)], K, spk, float(rng.uniform(-2, 2)), float(rng.uniform(.85, 1.15)), 'crowd', 1.0, 'crowd')
        parts.append((int(rng.uniform(0, .35) * SR), a * rng.uniform(.5, .9)))
    n = max(o + len(a) for o, a in parts); mix = np.zeros(n, np.float32)
    for o, a in parts: mix[o:o + len(a)] += a
    mix = mix / len(parts) * 2.6
    if kind == 'cheer': mix = np.concatenate([mix, np.zeros(max(0, int((dur or 2.5) * SR) - len(mix)), np.float32)]); ap = crowd('applause', dur or 2.5); mix[:len(ap)] += ap[:len(mix)]
    return mix


def main():
    timeline = {'fps': 30, 'scenes': []}; track = []; t0 = 0.0
    for sc in SCENES:
        cur = 0.0; last_start = 0.0; cues = {}; lines = []; songs = []; layers = []
        for c in sc['cues']:
            kind = c[0]
            if kind == 'gap':
                if len(c) > 2: cues[c[2]] = [round(cur, 3), c[1]]
                cur += c[1]
            elif kind == 'mark':
                cues[c[1]] = [round(cur, 3), 0]
            elif kind == 'crowd':
                o = c[3] if len(c) > 3 else {}; a = crowd(c[1], o.get('dur'))
                at = max(0, cur + o.get('at', 0)); layers.append((at, a)); cues[c[2]] = [round(at, 3), round(len(a) / SR, 3)]
            elif kind == 'song':
                name, o = c[1], c[2]; beat = 60 / o['bpm']; st = cur; tt = st + o['intro'] * beat; sl = []
                for text, beats in o['lines']:
                    slot = beats * beat
                    if o['singer'] == 'choir': a = choir_line(text, slot)
                    else:
                        who = 'elijah'; fx = 'ballad' if o['singer'] == 'elijah_ballad' else 'sing'
                        mdl, spk, semis, scale, _ = VOICES[who]
                        a = fit(lambda t: tts(text, mdl, spk, semis, scale, fx, t, 'song'), slot * .92)
                    layers.append((tt + .03, a)); d = len(a) / SR
                    sl.append({'text': text, 't': round(tt, 3), 'd': round(d, 3), 'slot': round(slot, 3)})
                    if o['singer'] != 'choir': lines.append({'who': 'elijah', 't': round(tt + .03, 3), 'd': round(d, 3), 'env': envelope(a), 'text': text, 'song': True})
                    else: lines.append({'who': 'choir', 't': round(tt + .03, 3), 'd': round(d, 3), 'env': envelope(a), 'text': text, 'song': True})
                    tt += slot
                end = tt + o['outro'] * beat
                songs.append({'name': name, 't': round(st, 3), 'd': round(end - st, 3), 'bpm': o['bpm'], 'intro': o['intro'], 'lines': sl})
                cues[name] = [round(st, 3), round(end - st, 3)]; cur = end
            else:
                who, text = c[0], c[1]; name = c[2] if len(c) > 2 else None; o = c[3] if len(c) > 3 else {}
                a = say(who, text); d = len(a) / SR
                layers.append((cur, a)); lines.append({'who': who, 't': round(cur, 3), 'd': round(d, 3), 'env': envelope(a), 'text': text})
                if name: cues[name] = [round(cur, 3), round(d, 3)]
                last_start = cur; cur += d + PAUSE_K * o.get('pause', .35)
        dur = round(cur + .3, 3)
        for at, a in layers: track.append((t0 + at, a))
        timeline['scenes'].append({'id': sc['id'], 'title': sc['title'], 'start': round(t0, 3), 'dur': dur, 'cues': cues, 'lines': lines, 'songs': songs})
        print(f"{sc['id']:10s} {dur:6.1f}s  (starts {t0:6.1f})"); t0 += dur
    timeline['total'] = round(t0, 3)
    n = int((t0 + 1) * SR); mix = np.zeros(n, np.float32)
    for at, a in track: i = int(at * SR); mix[i:i + len(a)] += a[:n - i]
    pk = np.abs(mix).max(); mix = mix / pk * .9 if pk > .9 else mix
    with wave.open(os.path.join(B, 'voice.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(B, 'voice.wav'), '-c:a', 'libopus', '-b:a', '56k', os.path.join(B, 'voice.ogg')], check=True)
    json.dump(timeline, open(os.path.join(B, 'timeline.json'), 'w'))
    print(f'total {t0:.1f}s = {int(t0 // 60)}:{int(t0 % 60):02d}')


if __name__ == '__main__':
    main()
