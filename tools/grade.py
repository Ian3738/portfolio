#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
日系霧面高調調色。

參數由 saitokyoko.jp 三張照片實測反推：
  黑點（1% 亮度）51–75、白點（99%）約 246、平均飽和度 0.078–0.100、中間調偏亮。

固定一組數值套在起點差很多的原檔上會失準，所以每張先正規化再對齊目標：
  1 自動色階：把 0.5% 與 99.5% 拉到兩端，讓所有原檔從同一基準出發
  2 以 gamma 把中位亮度推到目標
  3 抬黑壓白到 52 / 247
  4 用二分法解出飽和倍率，讓平均飽和度落在 0.090
  5 中間調微暖、極輕柔光
"""
import sys, os
import numpy as np
from PIL import Image, ImageFilter

T_BLACK  = 52 / 255.0
T_WHITE  = 247 / 255.0
T_MEDIAN = 0.70      # 目標中位亮度（0–1），對應 179/255
T_SAT    = 0.090     # 目標平均飽和度
WARM     = 0.020
BLOOM    = 0.10
LUMW = np.array([0.2126, 0.7152, 0.0722])

def sat_mean(a):
    x = np.clip(a, 0, 1) * 255
    mx, mn = x.max(2), x.min(2)
    return float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean())

def grade(im):
    a = np.asarray(im.convert('RGB')).astype(np.float64) / 255.0

    # 1) 自動色階（以亮度為準，避免破壞色相）
    lum = a @ LUMW
    lo, hi = np.percentile(lum, 0.5), np.percentile(lum, 99.5)
    if hi - lo > 1e-4:
        a = (a - lo) / (hi - lo)
    a = np.clip(a, 0, 1)

    # 2) 以 gamma 把中位亮度推到目標
    med = float(np.median(a @ LUMW))
    if 1e-3 < med < 0.999:
        g = np.log(T_MEDIAN) / np.log(med)
        g = float(np.clip(g, 0.45, 1.6))
        a = a ** g

    # 3) 錨定黑白點：把 1% 與 99% 直接映到目標值，不論原檔起點為何
    lum = a @ LUMW
    p1, p99 = np.percentile(lum, 1), np.percentile(lum, 99)
    if p99 - p1 > 1e-4:
        k = (T_WHITE - T_BLACK) / (p99 - p1)
        a = T_BLACK + (a - p1) * k
    a = np.clip(a, 0, 1)

    # 4) 解飽和倍率。抬黑之後才量，且只降不升：
    #    這是一組減飽和配方，硬把低彩度的棚拍推上去只會讓膚色失真。
    lum = a @ LUMW
    dev = a - lum[..., None]
    if sat_mean(a) > T_SAT:
        s0, s1 = 0.0, 1.0
        for _ in range(24):
            s = (s0 + s1) / 2
            if sat_mean(np.clip(lum[..., None] + dev * s, 0, 1)) > T_SAT: s1 = s
            else: s0 = s
        s = (s0 + s1) / 2
    else:
        s = 1.0
    a = np.clip(lum[..., None] + dev * s, 0, 1)

    # 5) 中間調微暖
    lum2 = a @ LUMW
    w = np.exp(-((lum2 - 0.58) ** 2) / (2 * 0.24 ** 2))[..., None]
    a = np.clip(a + w * np.array([WARM, WARM * 0.15, -WARM]), 0, 1)

    out = Image.fromarray((a * 255).round().astype(np.uint8))

    # 6) 極輕柔光，只在亮處作用
    blur = out.filter(ImageFilter.GaussianBlur(radius=max(2, out.size[0] // 260)))
    o = np.asarray(out).astype(np.float64); b = np.asarray(blur).astype(np.float64)
    screen = 255 - (255 - o) * (255 - b) / 255.0
    m = ((o @ LUMW) / 255.0)[..., None] ** 2
    o = o * (1 - BLOOM * m) + screen * (BLOOM * m)
    return Image.fromarray(np.clip(o, 0, 255).round().astype(np.uint8)), s

def stats(p):
    a = np.asarray(Image.open(p).convert('RGB')).astype(float)
    lum = a @ LUMW
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return np.percentile(lum,1), np.percentile(lum,50), np.percentile(lum,99), sat.mean()

if __name__ == '__main__':
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    jobs = [('形象照.JPG','portrait.jpg',900), ('IMG_9283.jpeg','gallery-lead.jpg',1600),
            ('IMG_0305.jpeg','gallery-1.jpg',900), ('IMG_0333.jpeg','gallery-2.jpg',900),
            ('IMG_0174.JPG','gallery-3.jpg',900)]
    print('目標　黑點 52　中位 179　白點 247　飽和 0.090')
    print(f'{"檔名":<18}{"黑點":>14}{"中位":>12}{"白點":>12}{"飽和":>10}{"倍率":>8}{"大小":>9}')
    for src, dst, w in jobs:
        sp, dp = os.path.join(src_dir, src), os.path.join(dst_dir, dst)
        im = Image.open(sp).convert('RGB')
        if im.size[0] > w:
            im = im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)
        b0, m0, w0, s0 = stats(sp)
        g, sfac = grade(im)
        g.save(dp, 'JPEG', quality=72, optimize=True, progressive=True)
        b1, m1, w1, s1 = stats(dp)
        print(f'{dst:<18}{b0:6.1f}→{b1:6.1f}{m0:6.1f}→{m1:5.1f}{w0:6.1f}→{w1:5.1f}'
              f'{s0:5.3f}→{s1:5.3f}{sfac:8.2f}{os.path.getsize(dp)//1024:7d} KB')
