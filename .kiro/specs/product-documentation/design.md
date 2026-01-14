# 设计文档 - Claude Code UI

## 概述

Claude Code UI 是一个全栈 Web 应用程序，采用现代化的技术栈构建，提供跨平台的 AI 编程助手界面。系统采用客户端-服务器架构，通过 WebSocket 实现实时通信，支持多种 AI 提供商（Claude、Cursor、Codex）的统一访问。

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React UI    │  │  WebSocket   │  │  Service     │      │
│  │  Components  │  │  Client      │  │  Worker      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        服务器层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express.js  │  │  WebSocket   │  │  Auth        │      │
│  │  REST API    │  │  Server      │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      集成层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Claude SDK  │  │  Cursor CLI  │  │  Codex SDK   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  SQLite DB   │  │  File System │  │  Git Repos   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

**前端：**
- React 18 - UI 框架
- React Router - 路由管理
- Tailwind CSS - 样式框架
- CodeMirror 6 - 代码编辑器
- xterm.js - 终端模拟器
- Lucide React - 图标库
- React Markdown - Markdown 渲染

**后端：**
- Node.js - 运行时环境
- Express.js - Web 框架
- WebSocket (ws) - 实时通信
- SQLite3 - 数据库
- node-pty - 伪终端支持
- Chokidar - 文件系统监控
- bcrypt - 密码加密
- JWT - 身份验证令牌

**构建工具：**
- Vite - 构建工具和开发服务器
- PostCSS - CSS 处理
- Autoprefixer - CSS 前缀自动添加

## 组件和接口

### 前端组件架构

#### 核心组件

1. **App.jsx**
   - 应用程序根组件
   - 路由配置
   - 全局状态管理
   - 会话保护系统实现

2. **Sidebar.jsx**
   - 项目和会话列表
   - 项目创建和管理
   - 会话导航

3. **MainContent.jsx**
   - 主内容区域容器
   - 标签页管理（聊天、文件、Git）
   - 内容路由

4. **ChatInterface.jsx**
   - AI 对话界面
   - 消息流式渲染
   - 工具调用显示
   - 输入控制

5. **FileTree.jsx**
   - 文件浏览器
   - 树形结构展示
   - 文件操作

6. **CodeEditor.jsx**
   - 代码编辑器
   - 语法高亮
   - 文件保存

7. **GitPanel.jsx**
   - Git 状态显示
   - 变更管理
   - 提交和分支操作

8. **Shell.jsx**
   - 终端界面
   - PTY 会话管理
   - 命令执行

#### Context Providers

1. **AuthContext**
   - 用户身份验证状态
   - 登录/注册/登出功能
   - 令牌管理

2. **WebSocketContext**
   - WebSocket 连接管理
   - 消息发送和接收
   - 连接状态监控

3. **ThemeContext**
   - 主题切换（亮色/暗色）
   - 主题偏好持久化

4. **TaskMasterContext**
   - TaskMaster 集成状态
   - 任务数据管理

5. **TasksSettingsContext**
   - 任务设置管理
   - 配置持久化

### 后端 API 接口

#### 身份验证 API

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/user
GET  /api/auth/status
```

#### 项目 API

```
GET    /api/projects
GET    /api/projects/:projectName/sessions
GET    /api/projects/:projectName/sessions/:sessionId/messages
PUT    /api/projects/:projectName/rename
DELETE /api/projects/:projectName
DELETE /api/projects/:projectName/sessions/:sessionId
POST   /api/projects/create
```

#### 文件 API

```
GET /api/projects/:projectName/files
GET /api/projects/:projectName/file
PUT /api/projects/:projectName/file
GET /api/projects/:projectName/files/content
```

#### Git API

```
GET  /api/git/status
POST /api/git/stage
POST /api/git/unstage
POST /api/git/commit
GET  /api/git/branches
POST /api/git/checkout
GET  /api/git/diff
```

#### MCP API

```
GET    /api/mcp/servers
POST   /api/mcp/servers
PUT    /api/mcp/servers/:serverId
DELETE /api/mcp/servers/:serverId
POST   /api/mcp/servers/:serverId/reconnect
```

#### 系统 API

```
POST /api/system/update
GET  /health
```

### WebSocket 协议

#### 客户端到服务器消息

```javascript
// Claude 命令
{
  type: 'claude-command',
  command: string,
  options: {
    projectPath: string,
    sessionId?: string,
    model?: string
  }
}

// Cursor 命令
{
  type: 'cursor-command',
  command: string,
  options: {
    cwd: string,
    sessionId?: string,
    model?: string
  }
}

// Codex 命令
{
  type: 'codex-command',
  command: string,
  options: {
    projectPath: string,
    sessionId?: string,
    model?: string
  }
}

// 中止会话
{
  type: 'abort-session',
  sessionId: string,
  provider: 'claude' | 'cursor' | 'codex'
}

// 工具权限响应
{
  type: 'claude-permission-response',
  requestId: string,
  allow: boolean,
  updatedInput?: object,
  rememberEntry?: object
}
```

#### 服务器到客户端消息

```javascript
// 消息流
{
  type: 'message',
  role: 'user' | 'assistant',
  content: string,
  sessionId: string
}

// 工具使用
{
  type: 'tool_use',
  name: string,
  input: object,
  id: string
}

// 工具结果
{
  type: 'tool_result',
  tool_use_id: string,
  content: string
}

// 会话信息
{
  type: 'session-info',
  sessionId: string,
  provider: string
}

// 项目更新
{
  type: 'projects_updated',
  projects: Array,
  timestamp: string,
  changeType: string,
  changedFile: string
}

// 错误
{
  type: 'error',
  error: string,
  details?: object
}
```

## 数据模型

### 数据库模式

#### users 表

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  has_completed_onboarding BOOLEAN DEFAULT 0
)
```

#### api_keys 表

```sql
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  is_active BOOLEAN DEFAULT 1
)
```

### 文件系统数据结构

#### 项目目录结构

```
~/.claude/projects/
├── project-name/
│   ├── .claude/
│   │   └── project.json
│   └── sessions/
│       ├── session-id-1.jsonl
│       ├── session-id-2.jsonl
│       └── ...
```

#### project.json 格式

```json
{
  "name": "project-name",
  "displayName": "Project Display Name",
  "path": "/absolute/path/to/project",
  "created": "2024-01-01T00:00:00.000Z",
  "updated": "2024-01-01T00:00:00.000Z"
}
```

#### session.jsonl 格式

每行一个 JSON 对象：

```json
{"type":"message","role":"user","content":"Hello"}
{"type":"message","role":"assistant","content":"Hi there!"}
{"type":"tool_use","name":"read_file","input":{"path":"file.js"},"id":"tool_1"}
{"type":"tool_result","tool_use_id":"tool_1","content":"file contents"}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：会话保护一致性

*对于任何*活动会话，当用户发送消息时，系统应该阻止项目自动更新，直到会话完成或中止。

**验证：需求 14.1, 14.2, 14.3**

### 属性 2：身份验证令牌有效性

*对于任何*受保护的 API 端点，当请求包含有效的 JWT 令牌时，系统应该允许访问；当令牌无效或缺失时，系统应该拒绝访问。

**验证：需求 7.3, 7.4, 7.5**

### 属性 3：文件访问边界

*对于任何*文件操作请求，系统应该只允许访问项目根目录内的文件，拒绝访问项目外的文件。

**验证：需求 5.6**

### 属性 4：WebSocket 消息顺序

*对于任何*WebSocket 会话，消息应该按照发送顺序被接收和处理。

**验证：需求 4.2, 4.3**

### 属性 5：项目更新通知

*对于任何*文件系统变更，当变更发生在监控的项目目录中时，系统应该通知所有连接的客户端。

**验证：需求 2.6**

### 属性 6：会话消息持久化

*对于任何*会话消息，当消息被发送或接收时，系统应该将其持久化到 JSONL 文件中。

**验证：需求 3.2**

### 属性 7：密码加密安全性

*对于任何*用户密码，系统应该使用 bcrypt 加密存储，永不存储明文密码。

**验证：需求 7.2**

### 属性 8：响应式布局适配

*对于任何*屏幕尺寸，当宽度小于 768px 时，系统应该切换到移动布局；否则使用桌面布局。

**验证：需求 8.2**

### 属性 9：工具权限默认拒绝

*对于任何*AI 工具，系统应该默认禁用该工具，直到用户明确启用。

**验证：需求 10.1**

### 属性 10：会话 ID 唯一性

*对于任何*新创建的会话，系统应该生成全局唯一的会话标识符。

**验证：需求 3.1**

## 错误处理

### 错误类型和处理策略

1. **网络错误**
   - WebSocket 断开：自动重连机制，最多重试 3 次
   - HTTP 请求失败：显示用户友好的错误消息
   - 超时：设置合理的超时时间（30 秒）

2. **身份验证错误**
   - 令牌过期：重定向到登录页面
   - 无效凭据：显示错误消息，允许重试
   - 权限不足：返回 403 状态码

3. **文件系统错误**
   - 文件不存在：返回 404 状态码
   - 权限拒绝：返回 403 状态码
   - 磁盘空间不足：显示警告消息

4. **AI 提供商错误**
   - API 限流：显示重试建议
   - 模型不可用：提供替代模型选项
   - 响应超时：允许用户中止和重试

5. **数据库错误**
   - 连接失败：尝试重新初始化数据库
   - 查询错误：记录错误并返回通用错误消息
   - 约束违反：返回具体的验证错误

### 错误日志

所有错误应该被记录到控制台，包含：
- 时间戳
- 错误类型
- 错误消息
- 堆栈跟踪（开发模式）
- 用户上下文（如果适用）

## 测试策略

### 单元测试

**目标：** 验证单个组件和函数的正确性

**覆盖范围：**
- 工具函数（utils/）
- API 路由处理器
- 数据库操作
- 身份验证中间件
- WebSocket 消息处理

**工具：** Jest, React Testing Library

### 集成测试

**目标：** 验证组件之间的交互

**覆盖范围：**
- API 端点集成
- WebSocket 通信流程
- 文件系统操作
- Git 操作
- 数据库事务

**工具：** Jest, Supertest

### 端到端测试

**目标：** 验证完整的用户工作流

**覆盖范围：**
- 用户注册和登录
- 项目创建和管理
- 会话创建和恢复
- 文件编辑和保存
- Git 提交流程

**工具：** Playwright, Cypress

### 性能测试

**目标：** 确保系统在负载下的性能

**测试场景：**
- 并发 WebSocket 连接（100+ 客户端）
- 大文件加载（10MB+）
- 长会话历史（1000+ 消息）
- 文件系统监控（1000+ 文件）

**工具：** Artillery, k6

### 安全测试

**目标：** 验证安全措施的有效性

**测试场景：**
- SQL 注入防护
- XSS 攻击防护
- CSRF 防护
- 路径遍历防护
- 身份验证绕过尝试

**工具：** OWASP ZAP, Burp Suite

## 性能优化

### 前端优化

1. **代码分割**
   - 路由级别的懒加载
   - 组件级别的动态导入
   - 第三方库的按需加载

2. **资源优化**
   - 图片压缩和懒加载
   - CSS 和 JS 压缩
   - 使用 CDN 加速静态资源

3. **渲染优化**
   - React.memo 防止不必要的重渲染
   - 虚拟滚动处理长列表
   - 防抖和节流优化频繁操作

4. **缓存策略**
   - Service Worker 缓存静态资源
   - LocalStorage 缓存用户偏好
   - 内存缓存频繁访问的数据

### 后端优化

1. **数据库优化**
   - 索引关键查询字段
   - 使用预编译语句
   - 连接池管理

2. **文件系统优化**
   - 文件监控防抖（300ms）
   - 忽略不必要的目录（node_modules, .git）
   - 缓存项目目录结构

3. **WebSocket 优化**
   - 消息批处理
   - 压缩大消息
   - 心跳保持连接

4. **内存管理**
   - PTY 会话超时清理（30 分钟）
   - 限制并发会话数量
   - 定期垃圾回收

## 部署架构

### 开发环境

```
npm run dev
```

- Vite 开发服务器（端口 5173）
- Express 后端服务器（端口 3001）
- 热模块替换（HMR）
- 源码映射

### 生产环境

```
npm run build
npm start
```

- 静态文件构建到 dist/
- Express 服务静态文件和 API
- 单一端口部署（默认 3001）
- 生产优化（压缩、Tree Shaking）

### PM2 部署

```bash
pm2 start claude-code-ui --name "claude-code-ui"
pm2 startup
pm2 save
```

- 后台进程管理
- 自动重启
- 日志管理
- 系统启动自动运行

### Docker 部署（可选）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 安全考虑

### 身份验证和授权

1. **密码安全**
   - bcrypt 加密（成本因子 10）
   - 密码强度要求
   - 防暴力破解（速率限制）

2. **令牌管理**
   - JWT 签名验证
   - 令牌过期时间（24 小时）
   - 安全的令牌存储（httpOnly cookies 或 localStorage）

3. **API 密钥**
   - 可选的 API 密钥验证
   - 密钥哈希存储
   - 密钥轮换支持

### 数据保护

1. **输入验证**
   - 所有用户输入验证
   - 参数类型检查
   - 长度限制

2. **输出编码**
   - HTML 转义
   - JSON 序列化
   - SQL 参数化查询

3. **文件访问控制**
   - 路径规范化
   - 目录遍历防护
   - 权限检查

### 网络安全

1. **HTTPS**
   - 生产环境强制 HTTPS
   - 安全的 Cookie 标志
   - HSTS 头部

2. **CORS**
   - 配置允许的源
   - 凭据处理
   - 预检请求

3. **WebSocket 安全**
   - 令牌验证
   - 源验证
   - 消息大小限制

## 可扩展性

### 水平扩展

1. **负载均衡**
   - Nginx 反向代理
   - 会话粘性（Sticky Sessions）
   - WebSocket 支持

2. **状态管理**
   - 无状态 API 设计
   - 共享会话存储（Redis）
   - 分布式文件系统

### 垂直扩展

1. **资源优化**
   - 内存使用监控
   - CPU 使用优化
   - 数据库查询优化

2. **缓存策略**
   - 应用级缓存
   - 数据库查询缓存
   - CDN 缓存

## 监控和日志

### 应用监控

1. **性能指标**
   - 响应时间
   - 吞吐量
   - 错误率
   - 资源使用

2. **业务指标**
   - 活跃用户数
   - 会话创建数
   - API 调用次数
   - 功能使用统计

### 日志管理

1. **日志级别**
   - ERROR：错误和异常
   - WARN：警告信息
   - INFO：重要事件
   - DEBUG：调试信息

2. **日志格式**
   - 结构化日志（JSON）
   - 时间戳
   - 请求 ID
   - 用户上下文

3. **日志存储**
   - 文件日志轮转
   - 集中式日志收集
   - 日志保留策略

## 维护和更新

### 版本管理

1. **语义化版本**
   - MAJOR.MINOR.PATCH
   - 变更日志
   - 发布说明

2. **自动更新**
   - GitHub Releases 检查
   - 更新通知
   - 一键更新命令

### 数据库迁移

1. **迁移脚本**
   - 版本化迁移
   - 向前和向后兼容
   - 自动执行

2. **备份策略**
   - 定期备份
   - 迁移前备份
   - 恢复测试

### 依赖管理

1. **依赖更新**
   - 定期检查更新
   - 安全补丁优先
   - 兼容性测试

2. **漏洞扫描**
   - npm audit
   - Snyk 集成
   - 自动化修复
