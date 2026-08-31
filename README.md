🥷 # VivChat - 基于 VivGrid 的 AI 对话界面

<p align="center">
  基于 Next.js 与 VivGrid 的对话界面模板，支持流式输出、工具调用展示与用量统计
</p>

<p align="center">
  <a href="https://github.com/Viskeyy/viv-chatbot"><img src="https://img.shields.io/github/stars/Viskeyy/viv-chatbot?style=flat&label=Stars" alt="GitHub Stars" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FViskeyy%2Fviv-chatbot&env=NEXT_PUBLIC_VIVGRID_API_KEY">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
</p>

本项目基于 [Next.js](https://nextjs.org)、[@yomo/viv](https://www.npmjs.com/package/@yomo/viv) 与 [VivGrid](https://vivgrid.com) 实现。前端通过 Edge Function 代理到 `https://api.vivgrid.com/v1`，无需自建后端即可接入兼容 OpenAI 协议的 Agent。

## 特性

- 流式对话：通过 `viv.chat.completions.stream()` 逐块渲染，包含 Streaming 状态提示
- 上下文携带：默认携带最近 7 轮消息发起请求
- 工具调用展示：`functionCall` 与 `functionCallResult` 以抽屉形式展示参数与返回结果
- 模型与用量信息：流结束后展示所用模型与 Token 用量（Total、Prompt、Completion）
- Markdown 渲染：基于 `react-markdown` 与 `rehype-raw`，支持代码块、表格与内联 HTML
- 交互细节：Enter 发送，Shift+Enter 换行，Cmd/Ctrl+I 聚焦输入框，支持单条复制与重试
- Edge 代理：`app/api/chat/completions/route.ts` 以 Edge Runtime 转发请求

## 技术栈

- 框架：Next.js 16（App Router）、React 19
- 样式：Tailwind CSS 4、tw-animate-css、class-variance-authority
- 组件：shadcn/ui（new-york）、Radix Dialog/Slot、vaul、sonner
- AI 接入：`@yomo/viv`（客户端）、`@yomo/viv-next`（服务端代理）
- 其他：react-markdown、rehype-raw、lucide-react、next-themes

## 目录结构

```
viv-chatbot/
├── app/
│   ├── api/chat/completions/route.ts  # Edge 代理，转发至 VivGrid
│   ├── layout.tsx                     # 全局布局、字体与 metadata
│   ├── page.tsx                       # 对话页，状态管理与流式处理
│   └── globals.css                    # Tailwind 主题与流式块样式
├── components/
│   ├── ChatHeader.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessages.tsx
│   ├── MarkdownRender.tsx
│   ├── FunctionSheet.tsx
│   ├── ModelInfo.tsx
│   └── ui/
├── lib/
│   ├── streamChunk.ts                 # chunk 分发：content、model、usage、functionCall
│   ├── randomId.ts
│   └── utils.ts
└── env.template
```

## 快速开始

### 环境要求

- Node.js >= 18.17
- pnpm（推荐）或 npm、yarn、bun

### 获取 API Key

前往 [VivGrid](https://vivgrid.com) 注册并创建 API Key。

### 本地运行

```bash
git clone https://github.com/Viskeyy/viv-chatbot.git
cd viv-chatbot

pnpm install

cp env.template .env.local
# 编辑 .env.local，填入以下其一
# NEXT_PUBLIC_VIVGRID_API_KEY=your_key
# VIVGRID_API_KEY=your_key

pnpm dev
# 打开 http://localhost:3000
```

`app/page.tsx` 中 `Viv` 实例通过 `baseURL: '/api'` 指向本地代理，`app/api/chat/completions/route.ts` 再转发至 `https://api.vivgrid.com/v1`。API Key 由服务端注入，无需在前端硬编码上游地址。

### 构建

```bash
pnpm build
pnpm start
pnpm lint
```

## 环境变量

| 变量 | 说明 |
|---|---|
| `NEXT_PUBLIC_VIVGRID_API_KEY` | 客户端可读的 VivGrid Key，`app/page.tsx` 中直接使用，适用于纯前端部署 |
| `VIVGRID_API_KEY` | 服务端 Key，由 `@yomo/viv-next` 在 Edge 代理中读取 |

二选一即可，参考 `env.template`。在 Vercel 上部署时，在 Settings 的 Environment Variables 中配置其中一个。

## 部署

点击上方 Deploy with Vercel 按钮一键部署，或参考 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)自行部署。

## 工作原理

```
浏览器（Viv SDK）         Next.js Edge Function        VivGrid
page.tsx -- stream --> /api/chat/completions -- POST --> api.vivgrid.com/v1
       <-- chunks ------------ proxy stream <------------ model、usage、functionCall、content
       applyStreamChunk 聚合 contentBlock、toolsBlock、modelBlock、usageBlock
       增量更新消息并渲染 Markdown、FunctionSheet、ModelInfo
```

主要逻辑：

- `app/page.tsx` 负责组装近 7 轮上下文与新输入，创建空的 assistant 占位消息，遍历流并调用 `applyStreamChunk` 更新界面
- `lib/streamChunk.ts` 按 `chunk.type` 分发至对应状态块，工具调用以 `FunctionSheet` 标签字符串形式写入，由 `MarkdownRender.tsx` 通过 `rehypeRaw` 解析渲染

## 自定义

- 修改上游地址：编辑 `app/api/chat/completions/route.ts` 中的 `baseURL`
- 调整上下文长度：修改 `app/page.tsx` 中的 `slice(-7)`
- 样式：`app/globals.css` 定义了 oklch 色板与 `.chunk-fold` 等样式
- 扩展工具类型：在 `lib/streamChunk.ts` 中扩展类型，并在 `MarkdownRender.tsx` 注册组件

## 脚本

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 生产启动 |
| `pnpm lint` | 代码检查 |

## 许可

MIT，详见仓库 License。
