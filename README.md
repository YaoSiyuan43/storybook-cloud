# 小云朵回家 · 互动电子绘本

一个**完全用代码绘制**的儿童互动电子绘本（面向幼儿园中班，4–6 岁）。没有任何图片素材——
所有插画都是在 `<canvas>` 上用蜡笔/水彩质感程序化绘制的；书页有**真实可拖拽的翻页效果**；
点击画面里的小动物会有动画和声音；每一页都有**温暖、自然的真人感朗读**（离线、免费）。

> 《小云朵回家》：一朵小云朵从天上掉到山坡，小羊棉棉和森林里的朋友们想尽办法，
> 最后请山顶的风婆婆一起把它吹回了家。主题是**帮助朋友、遇到困难不放弃**，
> 还藏着**数数（1·2·3）**和**认识彩虹颜色**两个认知小环节。

## 运行

纯静态站点，必须用 http 打开（朗读音频要 `fetch`）：

```bash
python3 -m http.server 8777 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8777/index.html
```

点「打开绘本」，拖书页角或点两侧箭头翻页，点画面里的东西试试看。
左上角工具栏：朗读 / 背景音乐 / 音效 / 全屏。

## 重新生成配音

配音用 [edge-tts](https://github.com/rany2/edge-tts)（微软神经网络音色，免费、无需 API key、无需 GPU）。
文案在 `audio/manifest.json`，一行一条，键为 `"<页码>-<行号>"`。

```bash
python3 -m venv .ttsenv
.ttsenv/bin/pip install edge-tts
.ttsenv/bin/python tools/gen_audio.py        # 生成/更新 audio/*.mp3
```

改音色或语速：编辑 `manifest.json` 顶部的 `voice` / `rate` / `pitch`，再跑一次脚本。
为小朋友推荐放慢到约 0.75×（旁白 `rate=-30%`）。

## 代码结构

| 文件 | 作用 |
|---|---|
| `index.html` | 外壳：canvas、导航/工具栏、脚本加载顺序 |
| `css/style.css` | 只管 UI chrome，插画全在 canvas |
| `js/core.js` | `SB` 工具库：随机数、颜色、路径、蜡笔质感填充、纸张颗粒、粒子系统、静态画师 |
| `js/characters.js` | `SB.C.*` 每个角色一个函数，靠状态对象驱动动画 |
| `js/audio.js` | `SB.A` WebAudio 合成音效 + 音乐盒 + 朗读播放器 |
| `js/scenes-a…d.js` | `SB.DEF[i]` 每页一个（背景/状态/更新/绘制/点击/提示/文案） |
| `js/book.js` | 引擎：排版、翻页几何、输入、文字、朗读 UI |
| `audio/` | `manifest.json` + 逐行朗读 mp3 |
| `tools/gen_audio.py` | 从 manifest 生成配音 |

制作这类绘本的完整方法，见 [`SKILL.md`](./SKILL.md)。

## 许可

代码与原创故事 © 花椒绘本工作室。配音由 edge-tts（微软神经语音）生成。
