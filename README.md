<div align="center">
  <h1>WearMate / DigitalAtelier</h1>
  <p>AI 驱动的个人衣橱管理与穿搭推荐应用</p>
</div>

## 简介

WearMate（前端品牌名为 DigitalAtelier）是一款 AI 驱动的时尚衣橱管理应用。用户可以拍照上传衣物，AI 自动识别品类、材质、颜色并生成单品档案；通过上传个人照片分析肤色与体型，获得个性化的配色与穿搭建议；还可以基于已有衣橱生成不同场景的智能搭配方案。

本项目采用 **React + TypeScript + Vite** 构建前端，**Express** 提供后端 API，数据以 **mock JSON** 形式本地持久化。

## 功能特性

- **用户注册 / 登录**
  - 邮箱 + 密码注册与登录
  - 登录态通过 `localStorage` token 持久化，刷新页面自动恢复
  - 用户数据保存在 `data/users.json`
- **AI 衣物扫描**
  - 拍照或上传图片，自动提取名称、品牌、品类、材质、颜色等信息
  - 生成高时尚感的 AI 策展说明
- **个人风格分析**
  - 上传人像照片，分析肤色、肤色色号、体型
  - 推荐 5 种适合的个人色彩
- **智能搭配推荐**
  - 基于衣橱单品和用户信息，生成通勤、约会、休闲等场景穿搭
- **衣橱管理**
  - 浏览、收藏、查看单品详情

## 技术栈

- **前端**：React 19、TypeScript 5.8、Vite 6、Tailwind CSS 4
- **后端**：Express 4、tsx
- **AI**：Google Gemini（`@google/genai`）
- **数据存储**：本地 `data/*.json`（mock 数据）

## 快速开始

### 前置条件

- Node.js（推荐 v20+）
- Gemini API Key（用于 AI 扫描/分析/搭配功能）

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
# 复制 .env.example 为 .env.local，并填入你的 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev
```

应用将在 http://localhost:3000 运行。

## 默认账号

 mock 数据中已预置一个默认用户，方便直接体验：

- **邮箱**：`style@digitalatelier.com`
- **密码**：`password123`

你也可以在登录页切换到 **Create Account** 注册新用户，新用户会自动写入 `data/users.json`。

## 项目结构

```
WearMate-main/
├── data/                 # 本地 mock JSON 数据
│   └── users.json        # 用户账号数据
├── src/
│   ├── components/       # React 组件
│   ├── App.tsx           # 应用主入口与路由状态
│   ├── data.ts           # 初始 mock 单品与默认用户
│   ├── types.ts          # TypeScript 类型定义
│   └── ...
├── server.ts             # Express 后端与 API 路由
├── index.html
├── package.json
└── README.md
```

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/register` | 用户注册 |
| POST | `/api/login` | 用户登录 |
| POST | `/api/logout` | 用户登出 |
| GET  | `/api/me` | 获取当前登录用户信息 |
| POST | `/api/scan-item` | AI 扫描衣物图片 |
| POST | `/api/analyze-profile` | AI 分析个人风格 |
| POST | `/api/mix-match-outfit` | AI 生成穿搭推荐 |
| GET  | `/api/health` | 服务健康检查 |

## 注意事项

- `data/users.json` 为明文存储密码的 mock 数据库，仅用于本地开发与演示，请勿用于生产环境。
- AI 相关接口需要配置有效的 `GEMINI_API_KEY`，否则对应功能会返回错误。
- 图片上传使用 base64 编码，请求体较大，Express 已配置 `10mb` 的 JSON 解析限制。

## 构建与部署

```bash
# 生产构建
npm run build

# 运行生产版本
npm start
```

生产构建会同时打包前端静态资源与后端服务到 `dist/` 目录。
