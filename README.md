# Mineradio-LX

Mineradio-LX 是基于 [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) 修改的 Windows 桌面音乐播放器版本，重点增加了对 LX Music Desktop（洛雪音乐）自定义音源 `.js` 脚本的兼容支持。

本仓库是独立改版仓库，不提供原版 Mineradio 的蓝奏云下载入口、原版 Release 下载入口或原版安装说明。

## 当前状态

- 基于 Mineradio `1.1.1` 改造
- 新增洛雪自定义音源管理入口
- 支持导入、验证、启用、停用、替换、删除 `.js` 音源脚本
- 播放时优先通过当前启用的自定义音源解析播放地址
- 无启用音源时恢复原有网易云/QQ 解析逻辑

## 下载

当前仓库暂未发布独立安装包。

如果需要运行，可以先从源码构建：

```bash
npm install
npm run build:win
```

构建完成后，Windows 产物会输出到 `dist/`。

开发调试可以运行：

```bash
npm start
```

## 洛雪自定义音源使用

1. 启动桌面版。
2. 点击右上角“源”按钮，打开“洛雪自定义音源”。
3. 点击“导入 `.js` 音源”，选择你的洛雪音源脚本。
4. 脚本验证通过后，在列表里点击“启用”。
5. 一次只能启用一个音源；点击“停用音源”后恢复原有解析逻辑。

兼容目标为洛雪自定义源 API `2.0.0`。现阶段主要用于播放地址解析；搜索结果仍来自 Mineradio 原有的网易云音乐和 QQ 音乐接入。

## 安全说明

第三方音源脚本会在本机隔离运行时中执行，但它仍可能向外部 HTTP/HTTPS 服务发送歌曲信息或脚本自身持有的凭据。

只导入你信任的音源脚本。导入的脚本保存在本机用户数据目录，不会随应用上传或同步。

## 核心特性

- 洛雪 `.js` 自定义音源导入与启用
- 网易云音乐、QQ 音乐搜索和播放辅助
- 天气电台、每日推荐、私人电台和歌单入口
- 歌词舞台、粒子视觉、节奏视觉和 3D 歌单架
- 自定义专辑封面、自定义歌词和视觉参数存档
- Electron Windows 桌面客户端

## 开发命令

```bash
npm install
npm start
npm test
npm run build:win
```

桌面版入口由 Electron 主进程加载本地服务。`npm run build:win` 会生成 Windows 安装包，产物位于 `dist/`。

## 第三方音乐平台说明

Mineradio-LX 不是网易云音乐、QQ 音乐、腾讯音乐娱乐集团或 LX Music Desktop 的官方客户端，也不隶属于任何音乐平台或项目。

本项目中的第三方平台接入仅用于个人学习、本地客户端体验和用户自有账号的播放辅助。请遵守对应平台的用户协议、版权规则和会员权益规则。本项目不会提供绕过付费、绕过会员、破解音质或重新分发音乐内容的能力。

## 用户数据与隐私

登录 Cookie、搜索历史、自定义封面、自定义歌词、节奏分析缓存、自定义音源脚本等数据只应保存在本机用户数据目录或浏览器本地存储中，不应提交到仓库。

更多说明见 [PRIVACY.md](./PRIVACY.md)。

## 上游与致谢

本项目基于 [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) 修改。

感谢原作者 XxHuberrr 对 Mineradio 的设计与开发。

## 版权与授权

Copyright (C) 2026 XxHuberrr.

本项目作为 Mineradio 的改版，继续采用 GPL-3.0 授权。详见 [LICENSE](./LICENSE)。

MR Logo、Mineradio 名称、界面视觉设计与原创视觉表达归原作者所有；第三方依赖和第三方服务分别遵循其各自授权与服务条款。
