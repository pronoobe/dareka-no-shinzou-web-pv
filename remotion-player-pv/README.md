# C 版 · Remotion Player × Three.js

**完整实时网页版**：同一首歌、9 张本地 AI 原画、50 句日文歌词与中文译文、11 个分镜，在浏览器里用 `@remotion/player` + Three.js 实时渲染。不是预渲染视频，也不是播放 MP4。

在线地址：

**https://pronoobe.github.io/dareka-no-shinzou-web-pv/remotion-player-pv/**

## 与 A / B 版的区别

- A（GSAP）与 B（Remotion 导出）是无音频的影像版。
- **C 版包含原曲音轨**，可以在浏览器中边实时渲染边播放；仅作为非商业同人演示，音乐权利归原作者与权利方所有。
- C 版使用真正的 3D 场景：原画作为纹理贴到 `THREE.PlaneGeometry`，由 `PerspectiveCamera` 做物理推拉/摇移/微距，而不是 2D 图层缩放。

## 页面功能

- 封面 / 播放按钮
- 11 个分镜跳转，可随时切到序章、副歌、桥段与黎明
- 当前章节、时间码、章节高亮同步
- 播放器自带进度条、音量、全屏、循环
- `?t=181` 秒数深链（打开后从对应秒数开始，点击播放）
- 桌面与移动端响应式

## 技术

- Remotion 4 + `@remotion/player`
- React 19 + TypeScript
- Three.js r186 + `@remotion/three`
- 自定义 GLSL：背景调色/模糊、全息扫描、水面反射、粒子、光锥
- 9 张 Qwen-Image-2.1 本地生成原画，统一 GUMI 角色与雨夜/蓝/绯红配色
- 148 BPM 节拍脉冲；人声分离 + 逐词时间轴对齐

## 本地运行

在仓库根目录：

```bash
python -m http.server 8000
```

然后打开：

```text
http://127.0.0.1:8000/remotion-player-pv/
```

页面内的资源路径会自动根据所在目录计算，因此放在 GitHub Pages 的项目子路径下也能工作。

## 说明

- 这是完整的实时 WebGL 版本；源码工作目录保留在制作端，本目录是可直接部署的构建产物。
- 音频文件仅用于本仓库的非商业同人演示。若权利方需要下架，请联系仓库所有者，会立即移除。
- 原曲 / 词曲：**ユリイ・カノン（Yurry Canon） feat. GUMI** —「だれかの心臓になれたなら」。
