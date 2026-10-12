# DSH Desktop 销冠 Skill 安装指南

本指南适用于需要在自己的 Windows 或 macOS 电脑上使用销冠 Skill 的人。安装分成两部分：先把 Skill 商城的 MCP 服务器接入 DSH，再安装提供“销冠模式”按钮的 DSH 插件。按钮插件不包含 API Key，也不会替你连接 MCP。

## 准备材料

- 一个可用的 Skill 商城 API Key，且该 Key 已开通销冠 Skill。
- 能访问 GitHub 和 Skill 商城 MCP 地址的网络。

请只在自己的 DSH 中填写 Key；转发本指南时不要把 Key 一起发出去。

## 第一步：安装 DSH Desktop 2.0.17

| 系统 | 安装包 |
| --- | --- |
| Windows x64 | [下载 DSH-Desktop-2.0.17-x64-Setup.exe](https://github.com/anywhere-labs/dsh-desktop/releases/download/v2.0.17/DSH-Desktop-2.0.17-x64-Setup.exe) |
| macOS（Intel 或 Apple Silicon） | [下载 DSH-Desktop-2.0.17-universal.dmg](https://github.com/anywhere-labs/dsh-desktop/releases/download/v2.0.17/DSH-Desktop-2.0.17-universal.dmg) |

如果直链无法下载，请打开 [DSH Desktop v2.0.17 发布页](https://github.com/anywhere-labs/dsh-desktop/releases/tag/v2.0.17)，从 Assets 选择相应文件。这个桌面版由社区维护，并非 DeepSeek 官方桌面产品。

## 第二步：让 DSH 添加 Skill 商城 MCP

复制下面的提示词，先把 `<你的 Skill 商城 API Key>` 替换为自己的 Key，再发送给 DSH：

```text
请在这台电脑的 DSH Desktop 2.0.17 中接入 Skill 商城 MCP。

服务器名：skill-omniscience
MCP 地址：https://mcp.xn--15tq51d.top/mcp
Authorization：Bearer <你的 Skill 商城 API Key>

先检查 desktop Profile：若同名 MCP 已能调用销冠工具，就复用，不要重复添加；否则先备份配置，再添加或修正这一条，并保留其他插件。优先使用原生 Streamable HTTP；如该版本无法发现工具，可用 mcp-remote@0.14.2 桥接，并按当前 Windows/macOS 系统选择启动方式。若 npm 官方源有证书问题，可改用 https://registry.npmmirror.com，不要关闭 TLS 校验。不要回显完整 Key。

完成后用全新 MCP 会话执行 tools/list，确认服务端工具 sales_champion_coach__query 存在，再实际调用一次。不要用 resources 列表是否为空判断成功。若没有配置权限、缺少 Key 或验证失败，请如实说明，不要报告“已生效”。最后告诉我是否需要重启 DSH。
```

验收时，DSH 会话内应能看到并调用 `mcp__skill-omniscience__sales_champion_coach__query`。只有“配置保存成功”或“握手成功”，还不等于工具已经可用。

## 第三步：安装销冠模式按钮插件

在 DSH 中打开“插件”→“添加插件”，把下面的 GitHub 仓库地址粘贴到输入框，点击安装并启用：

```text
https://github.com/xiaoxiji647/dsh-sales-session-mode
```

安装后按 DSH 提示重启，并新建或重新打开会话。输入栏旁出现“销冠模式”按钮后，点击一次，显示“销冠 · 已开启”。之后在这个会话里直接提销售问题即可，无需每条消息都写前置提示词；再点一次可关闭。其他会话不会因为这个会话开启而自动开启。

## 快速验收

1. 打开销冠模式，直接发送“客户说价格太贵，我该怎么回应？”
2. 查看 DSH 的本轮工具调用记录，确认调用了 `mcp__skill-omniscience__sales_champion_coach__query`；不能仅凭按钮或回答内容判断。
3. 切换到另一个会话，确认它没有自动开启销冠模式。
4. 如需验证状态恢复，重启 DSH 后重新打开原会话检查按钮状态。

如果工具不存在，先核对 MCP 地址、Key 是否被授权使用销冠 Skill，以及 `tools/list` 的真实结果；不要只看 `resources`。如果按钮不出现，检查插件是否安装、启用，并重启 DSH。工具调用成功但回复仍是碎片化词语，属于 Skill 服务端内容质量问题，不代表插件没有安装成功。

目前 Windows 版的自动调用已实测；macOS 版及其他电脑通过 GitHub 地址安装后的全流程尚未实机验收。
