# DSH 销冠会话模式

适配 DSH Desktop 2.0.17 的插件。它只负责会话级开关；不连接 MCP、不保存密钥。请先在 DSH 中配置好 `skill-omniscience` MCP 服务器，并确认工具 `mcp__skill-omniscience__sales_champion_coach__query` 可调用。

转发给使用者的完整步骤见 [DSH Desktop 销冠 Skill 安装指南](INSTALL_GUIDE.zh-CN.md)。

## 第一步：安装 DSH Desktop

从 [DSH Desktop v2.0.17 发布页](https://github.com/anywhere-labs/dsh-desktop/releases/tag/v2.0.17) 下载对应安装包：

- Windows x64：`DSH-Desktop-2.0.17-x64-Setup.exe`
- macOS（Apple Silicon / Intel）：`DSH-Desktop-2.0.17-universal.dmg`

这是社区维护的桌面版，并非 DeepSeek 官方桌面产品。
本插件的自动调用已在 Windows 版实测；macOS 安装和会话行为尚未实机验证。

## 第二步：接入 Skill 商城 MCP

将以下提示词发给 DSH，把 `<你的 Skill 商城 API Key>` 换成自己的 Key：

```text
请在当前电脑的 DSH Desktop 2.0.17 中配置 Skill 商城 MCP。服务器名 skill-omniscience，Streamable HTTP 地址 https://mcp.xn--15tq51d.top/mcp，Authorization 为 Bearer <你的 Skill 商城 API Key>。先检查 desktop Profile，若已能调用 mcp__skill-omniscience__sales_champion_coach__query 就不要重复配置；否则备份原配置后添加或修正这一条，保留其他插件。优先使用原生 HTTP MCP；如该版本无法发现工具，可用 mcp-remote@0.14.2 桥接，并按当前系统分别配置启动命令。不要关闭 TLS 校验，不要输出完整 Key。完成后用全新 MCP 会话执行 tools/list，必须看到 sales_champion_coach__query，再做一次最小 query 调用；不要用 resources 为空判断工具不可用。告诉我是否需要重启，以及最终工具是否能调用。
```

## 第三步：安装会话按钮插件

在 DSH 的“插件”→“添加插件”中粘贴本仓库的 GitHub 地址，安装并启用插件；按 DSH 提示重启并新建会话。

**先连接 MCP，再装本插件。** 本插件不会替你配置 Skill 商城服务器，也不会收集或保存 API Key。如果安装后按钮可见但查询失败，请先确认 MCP 工具已在 DSH 中加载。

输入栏右侧会出现“销冠模式”。点击后显示“销冠 · 已开启”，该会话后续新的文字消息会先查询销冠 Skill，再生成回答；其他会话保持原状态。再点一次关闭。关闭/重开会话后，状态从 DSH 自己的插件设置恢复。

## 验收

1. 在会话 A 点开销冠模式，再切到会话 B：B 应保持关闭。
2. 回到 A，发一句销售问题，确认模型能引用销冠 Skill 结果。
3. 关闭并重启 DSH，重开 A，确认按钮仍显示开启。
4. 点关闭，再发一条消息，确认此轮不再主动调用销冠 Skill。

若按钮灰色，检查 DSH 插件设置是否可写；若按钮已开启但回答提示查询失败，检查原有 MCP 服务器和目标工具是否仍在线。插件不会替你修复 Skill 商城服务端返回的碎片化文本。

## 技术边界

开关保存在 DSH 插件条目 `sales-session-mode` 的 `enabledSessions` 字典中；不写入或读取 MCP API Key。该版本处理文字消息；图片/附件若无文字，不会发起销冠查询。工具结果作为插件来源的上下文加入当前轮，受 DSH 模型请求的上下文长度限制。
