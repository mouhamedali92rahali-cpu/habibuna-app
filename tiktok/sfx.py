# مؤثرات صوتية مولّدة (بلا موسيقى ولا ملفات خارجية): whoosh للانتقال بين المشاهد، tick لكل كلمة،
# pop لظهور البطاقة، ding للإشعار، check للتوثيق، chime لزر الصلاة والخاتمة.
# الاستعمال: python3 sfx.py cues.json out.wav   (cues = {"duration": ث, "sfx": [{"t","kind","gain"}]})
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def lowpass(x, cutoff):
    # مرشّح بقطب واحد بتردّد قطع متغيّر (مصفوفة أو رقم)
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def whoosh():
    n = int(.55 * SR); t = np.arange(n) / n
    noise = rng.standard_normal(n)
    sweep = 300 + 3200 * np.sin(np.pi * t) ** 2
    x = lowpass(noise, sweep) - lowpass(noise, sweep * .25)
    return x * np.sin(np.pi * t) ** 1.6 * 1.6


def tick(pitch=1.0):
    n = int(.07 * SR); t = np.arange(n) / SR
    f = 1500 * pitch
    x = np.sin(2 * np.pi * f * t) * env(n, .0015, .018)
    x += .25 * np.sin(2 * np.pi * 2 * f * t) * env(n, .001, .008)
    return x * .5


def pop():
    n = int(.16 * SR); t = np.arange(n) / SR
    f = 380 + 700 * (1 - np.exp(-t / .03))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, .05) * .8


def bell(freqs, decay, n_sec):
    n = int(n_sec * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / (decay * d)) for f, a, d in freqs)
    return x * np.minimum(1, t / .004)


def ding():
    a = bell([(1046.5, 1, 1), (2093, .3, .5)], .35, .6)
    b = bell([(1318.5, 1, 1), (2637, .3, .5)], .5, 1.0)
    out = np.zeros(int(1.15 * SR)); out[:len(a)] += a; s = int(.13 * SR); out[s:s + len(b)] += b
    return out * .35


def check():
    return bell([(1568, 1, 1), (3136, .2, .4)], .09, .3) * .4


def chime():
    notes = [(784, 0), (988, .09), (1175, .18), (1568, .27)]
    out = np.zeros(int(2.4 * SR))
    for f, d in notes:
        b = bell([(f, 1, 1), (f * 2.01, .25, .5), (f * 3.02, .08, .3)], .9, 2.0)
        s = int(d * SR); out[s:s + len(b)] += b * .28
    return out


def main(cues_path, out_path):
    meta = json.load(open(cues_path))
    total = np.zeros(int((meta['duration'] + 1) * SR))
    for i, c in enumerate(meta['sfx']):
        k = c['kind']
        x = {'whoosh': whoosh, 'pop': pop, 'ding': ding, 'check': check, 'chime': chime}.get(k)
        x = x() if x else tick(1 + .06 * ((i * 5) % 4 - 1.5))
        s = max(0, int(c['t'] * SR)); e = min(len(total), s + len(x))
        total[s:e] += x[:e - s] * c.get('gain', 1)
    total = total[:int(meta['duration'] * SR)]
    total *= .8 / max(1e-9, np.abs(total).max())
    fade = int(.4 * SR); total[-fade:] *= np.linspace(1, 0, fade)
    pcm = (np.clip(total, -1, 1) * 32767).astype('<i2')
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
