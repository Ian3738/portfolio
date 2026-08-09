#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
日式調色，可調強度。

與前一版的差別：不再強迫中位亮度對齊固定值。
參考站那些照片本來就是白棚高調，把戶外照推到同樣的亮度只會發白。
這版保留原檔的曝光，只做三件事：抬一點黑、收一點飽和、極輕的柔光。
"""
import numpy as np
from PIL import Image, ImageFilter

LUMW = np.array([0.2126, 0.7152, 0.0722])

PRESETS = {
    # 名稱:  黑點  白點  飽和   柔光  曝光微調
    'A_弱': dict(black=10, white=252, sat=0.200, bloom=0.03, lift=1.00),
    'B_中': dict(black=16, white=251, sat=0.170, bloom=0.05, lift=0.96),
    'C_強': dict(black=24, white=250, sat=0.145, bloom=0.08, lift=0.92),
}

def sat_mean(a):
    x = np.clip(a, 0, 1) * 255
    mx, mn = x.max(2), x.min(2)
    return float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean())

def grade(im, black, white, sat, bloom, lift):
    a = np.asarray(im.convert('RGB')).astype(np.float64) / 255.0
    tb, tw = black / 255.0, white / 255.0

    # 1) 只做溫和的曝光微調，不強推中位亮度
    if abs(lift - 1.0) > 1e-3:
        a = np.clip(a, 0, 1) ** lift

    # 2) 錨定黑白點
    lum = a @ LUMW
    p1, p99 = np.percentile(lum, 1), np.percentile(lum, 99)
    if p99 - p1 > 1e-4:
        a = tb + (a - p1) * (tw - tb) / (p99 - p1)
    a = np.clip(a, 0, 1)

    # 3) 飽和度：只降不升
    lum = a @ LUMW
    dev = a - lum[..., None]
    if sat_mean(a) > sat:
        lo, hi = 0.0, 1.0
        for _ in range(24):
            m = (lo + hi) / 2
            if sat_mean(np.clip(lum[..., None] + dev * m, 0, 1)) > sat: hi = m
            else: lo = m
        m = (lo + hi) / 2
    else:
        m = 1.0
    a = np.clip(lum[..., None] + dev * m, 0, 1)

    # 4) 中間調微暖
    l2 = a @ LUMW
    w = np.exp(-((l2 - 0.55) ** 2) / (2 * 0.24 ** 2))[..., None]
    a = np.clip(a + w * np.array([0.016, 0.002, -0.016]), 0, 1)

    out = Image.fromarray((a * 255).round().astype(np.uint8))

    # 5) 柔光，只在亮處
    if bloom > 0:
        blur = out.filter(ImageFilter.GaussianBlur(radius=max(2, out.size[0] // 300)))
        o = np.asarray(out).astype(np.float64); b = np.asarray(blur).astype(np.float64)
        screen = 255 - (255 - o) * (255 - b) / 255.0
        msk = ((o @ LUMW) / 255.0)[..., None] ** 2
        o = o * (1 - bloom * msk) + screen * (bloom * msk)
        out = Image.fromarray(np.clip(o, 0, 255).round().astype(np.uint8))
    return out

def stats(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    lum = a @ LUMW
    mx, mn = a.max(2), a.min(2)
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return np.percentile(lum, 1), np.percentile(lum, 50), np.percentile(lum, 99), s.mean()
