# Remotion 版源码（可重新构建）

`remotion-pv/` 里的 `player.js` 就是这份源码打包出来的。想自己改动画并重新出片：

```bash
npm i
npx remotion studio src/index.ts          # 可视化预览、逐帧调试
npx remotion render src/index.ts PV out/pv.mp4 --concurrency=5 --crf=17
npx remotion still src/index.ts PV out/a.png --frame 3420
```

需要的素材（`public/` 目录）：`audio.mp3`（自行准备原曲，仓库不提供）、`img/*.jpg`（AI 画面，可直接复制 `../gsap-pv/assets/img/`）、
`fonts/*.woff2` + `fonts.css`（复制 `../gsap-pv/assets/fonts/`）、`art.svg`（**本目录已附带**，是从 GSAP 版导出的线稿层）。
代码里会自动把 `.png` 映射成 `.jpg`，所以图片用压缩版即可。歌词时间轴已内置在 `pv-data.ts` 里，无需另外准备。

源码文件：
- `motion.ts` — 拍点时钟、心脏门控、震颤、相机解算、段落/排版/场景窗口表
- `PV.tsx` — 主合成，7 层景深装配
- `Plates.tsx` — AI 画面层（弹簧运镜 + 动态模糊）
- `ArtScene.tsx` — 线稿层（复用 art.svg，逐 id 驱动）
- `ArtExtra.tsx` — 电线/霓虹/血管/玻璃雨/涟漪/点滴/候鸟/花瓣/丝线
- `Lyrics.tsx` — 12 种歌词排版 + 逐字卡拉OK
- `Effects.tsx` — 心电图、雨雪水、文字环、后期（暗角/颗粒/闪光/扫光/频闪）
- `moods.ts` — 16 段落的情绪与线稿配色
