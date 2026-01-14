# 设计文档 - Claude Code Proxy 集成

## 概述

Claude Code Proxy 是一个新的 AI 提供商选项，通过 Claude CLI 命令行工具与代理服务器通信。该实现参考 Cursor CLI 的集成方式，使用子进程管理和流式输出解析，允许用户通过自定义代理服务器（如本地代理或企业代理）访问 Claude API。

### 核心特性

- 通过环境变量配置代理服务器
- 使用 Claude CLI 命令行工具
- 流式输出和实时响应
- 会话管理和恢复
- 与现有功能完全兼容
- 独立于 Claude SDK 实现

## 架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React UI    │  │  WebSocket   │  │  Provider    │      │
│  │  Components  │  │  Client      │  │  Selector    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        服务器层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express.js  │  │  WebSocket   │  │  claude-     │      │
│  │  REST API    │  │  Handler     │  │  proxy.js    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      进程层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Claude CLI  │  │  Child       │  │  Stream      │      │
│  │  Process     │  │  Process     │  │  Parser      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      代理层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Proxy       │  │  Claude API  │  │  Session     │      │
│  │  Server      │  │  Endpoint    │  │  Storage     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 组件和接口

### 后端组件

#### 1. claude-code-proxy.js

新建文件：`server/claude-code-proxy.js`

**职责：**
- 管理 Claude CLI 子进程
- 解析 Claude CLI 输出
- 转换消息格式
- 处理会话生命周期

**核心函数：**

```javascript
// 启动 Claude CLI 进程并处理对话
async function spawnClaudeProxy(command, options, ws)

// 中止活动会话
function abortClaudeProxySession(sessionId)

// 检查会话是否活动
function isClaudeProxySessionActive(sessionId)

// 获取所有活动会话
function getActiveClaudeProxySessions()

// 检查环境变量配置
function checkProxyConfiguration()
```


#### 2. WebSocket 消息处理

在 `server/index.js` 的 `handleChatConnection` 函数中添加新的消息类型处理：

```javascript
else if (data.type === 'claude-proxy-command') {
  await spawnClaudeProxy(data.command, data.options, writer);
}
else if (data.type === 'abort-session' && data.provider === 'claude-proxy') {
  const success = abortClaudeProxySession(data.sessionId);
  writer.send({
    type: 'session-aborted',
    sessionId: data.sessionId,
    provider: 'claude-proxy',
    success
  });
}
```

#### 3. 环境变量检测 API

新增 API 端点：`GET /api/claude-proxy/status`

**响应格式：**
```javascript
{
  available: boolean,
  baseUrl: string | null,
  hasApiKey: boolean,
  cliInstalled: boolean,
  error: string | null
}
```

### 前端组件

#### 1. 提供商选择器更新

在 `src/components/Settings.jsx` 或提供商选择组件中添加 Claude Code Proxy 选项。

**条件显示逻辑：**
```javascript
const [proxyAvailable, setProxyAvailable] = useState(false);

useEffect(() => {
  fetch('/api/claude-proxy/status')
    .then(res => res.json())
    .then(data => setProxyAvailable(data.available));
}, []);
```

#### 2. WebSocket 消息发送

在 `ChatInterface.jsx` 中，根据选择的提供商发送不同的消息类型：

```javascript
if (selectedProvider === 'claude-proxy') {
  sendMessage({
    type: 'claude-proxy-command',
    command: userMessage,
    options: {
      projectPath,
      sessionId,
      model
    }
  });
}
```

## 数据模型

### 环境变量配置

```bash
# 代理服务器地址
ANTHROPIC_BASE_URL=http://localhost:8082

# API 密钥（任意值）
ANTHROPIC_API_KEY=any-value
```

### Claude CLI 命令格式

```bash
# 新会话
claude -p "用户消息" --output-format stream-json --model sonnet

# 恢复会话
claude --resume <session-id> -p "用户消息" --output-format stream-json

# 继续最近会话
claude --continue -p "用户消息" --output-format stream-json
```

### 输出格式

Claude CLI 使用 `--output-format stream-json` 时，输出格式类似于 Cursor CLI：

```json
{"type":"system","subtype":"init","session_id":"uuid","model":"claude-sonnet-4-5"}
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"用户消息"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"响应片段"}]}}
{"type":"result","subtype":"success"}
```

### 消息转换映射

| Claude CLI 输出 | WebSocket 消息 | 说明 |
|----------------|---------------|------|
| `type: system, subtype: init` | `session-created` | 新会话创建 |
| `type: user` | `cursor-user` | 用户消息（复用格式） |
| `type: assistant` | `claude-response` | 助手响应 |
| `type: result` | `claude-complete` | 会话完成 |

## 正确性属性

### 属性 1：环境变量验证

*对于任何* Claude Code Proxy 启动请求，当且仅当 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_API_KEY` 都存在时，系统应该允许启动。

**验证：需求 1.3, 1.4**

### 属性 2：进程生命周期管理

*对于任何* Claude CLI 进程，当会话结束或被中止时，系统应该终止对应的进程并清理资源。

**验证：需求 3.2, 3.3**

### 属性 3：消息流式传输

*对于任何* Claude CLI 输出，系统应该实时捕获并通过 WebSocket 发送到客户端，不应缓冲完整响应。

**验证：需求 5.1, 5.2**

### 属性 4：会话 ID 唯一性

*对于任何* 新创建的会话，Claude CLI 应该生成全局唯一的会话标识符，系统应该正确捕获并使用该标识符。

**验证：需求 4.1**

### 属性 5：错误传播

*对于任何* Claude CLI 错误输出，系统应该捕获并通过 WebSocket 发送到客户端，不应静默失败。

**验证：需求 6.4**

### 属性 6：提供商隔离

*对于任何* Claude Code Proxy 会话，系统应该独立管理，不应影响 Claude SDK 或其他提供商的会话。

**验证：需求 15.3**

### 属性 7：命令注入防护

*对于任何* 用户输入，系统应该通过参数数组传递给 Claude CLI，不应通过字符串拼接，以防止命令注入。

**验证：需求 13.4**

### 属性 8：API 密钥保护

*对于任何* 日志输出，系统应该不记录完整的 `ANTHROPIC_API_KEY` 值，只显示是否存在。

**验证：需求 13.1**

## 错误处理

### 错误类型和处理策略

1. **环境变量缺失**
   - 检测：启动时检查环境变量
   - 处理：禁用 Claude Code Proxy 选项
   - 用户提示：显示配置说明

2. **Claude CLI 未安装**
   - 检测：尝试执行 `claude --version`
   - 处理：返回错误状态
   - 用户提示：显示安装链接

3. **代理服务器不可达**
   - 检测：Claude CLI 连接失败
   - 处理：捕获错误并通知用户
   - 用户提示：检查代理服务器状态

4. **进程崩溃**
   - 检测：监听进程 `error` 和 `close` 事件
   - 处理：清理进程引用，通知客户端
   - 用户提示：显示错误消息和重试选项

5. **输出解析失败**
   - 检测：JSON.parse 异常
   - 处理：将原始输出作为文本发送
   - 日志：记录解析失败的原始内容

## 测试策略

### 单元测试

**目标：** 验证核心函数的正确性

**覆盖范围：**
- 环境变量检测函数
- 命令参数构建
- 输出解析逻辑
- 消息格式转换
- 进程管理函数

**工具：** Jest

### 集成测试

**目标：** 验证与 Claude CLI 的集成

**覆盖范围：**
- 启动 Claude CLI 进程
- 捕获流式输出
- 会话创建和恢复
- 进程终止和清理
- 错误处理

**工具：** Jest, Mock 进程

### 端到端测试

**目标：** 验证完整的用户工作流

**覆盖范围：**
- 选择 Claude Code Proxy 提供商
- 创建新会话
- 发送消息并接收响应
- 恢复现有会话
- 中止会话

**工具：** Playwright

## 实现细节

### 进程管理

```javascript
// 进程映射：sessionId -> childProcess
const activeClaudeProxyProcesses = new Map();

// 进程超时清理（可选）
const PROCESS_TIMEOUT = 30 * 60 * 1000; // 30 分钟
```

### 命令参数构建

```javascript
function buildClaudeArgs(command, options) {
  const args = [];
  
  // 恢复会话
  if (options.sessionId) {
    args.push('--resume', options.sessionId);
  }
  
  // 用户消息
  if (command && command.trim()) {
    args.push('-p', command);
  }
  
  // 模型选择（仅新会话）
  if (!options.sessionId && options.model) {
    args.push('--model', options.model);
  }
  
  // 流式 JSON 输出
  args.push('--output-format', 'stream-json');
  
  // 跳过权限检查（如果启用）
  if (options.skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }
  
  return args;
}
```

### 输出解析

```javascript
function parseClaudeOutput(line, ws, messageBuffer) {
  try {
    const response = JSON.parse(line);
    
    switch (response.type) {
      case 'system':
        if (response.subtype === 'init') {
          // 捕获会话 ID
          const sessionId = response.session_id;
          ws.send({
            type: 'session-created',
            sessionId,
            model: response.model
          });
        }
        break;
        
      case 'user':
        ws.send({
          type: 'cursor-user',
          data: response
        });
        break;
        
      case 'assistant':
        // 累积消息并流式发送
        const textContent = response.message.content[0].text;
        messageBuffer += textContent;
        ws.send({
          type: 'claude-response',
          data: {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: textContent
            }
          }
        });
        break;
        
      case 'result':
        ws.send({
          type: 'claude-complete',
          sessionId: response.session_id,
          success: response.subtype === 'success'
        });
        break;
    }
  } catch (error) {
    // 非 JSON 输出，作为文本发送
    ws.send({
      type: 'claude-proxy-output',
      data: line
    });
  }
}
```

### 环境变量检测

```javascript
function checkProxyConfiguration() {
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  return {
    available: !!(baseUrl && apiKey),
    baseUrl: baseUrl || null,
    hasApiKey: !!apiKey,
    configured: !!(baseUrl && apiKey)
  };
}
```

### Claude CLI 安装检测

```javascript
async function checkClaudeCLI() {
  return new Promise((resolve) => {
    const process = spawn('claude', ['--version']);
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}
```

## 性能优化

### 1. 进程复用

- 考虑复用 Claude CLI 进程以减少启动开销
- 使用 `--continue` 参数继续对话
- 实现进程池管理

### 2. 流式处理

- 使用 `stream-json` 格式避免缓冲
- 实时发送输出片段
- 不等待完整响应

### 3. 资源清理

- 设置进程超时自动清理
- 监听服务器关闭事件清理所有进程
- 使用 WeakMap 自动垃圾回收

### 4. 并发控制

- 限制同时运行的 Claude CLI 进程数量
- 实现队列机制处理高并发
- 优先级调度（活动会话优先）

## 安全考虑

### 1. 命令注入防护

```javascript
// ✅ 正确：使用参数数组
spawn('claude', ['-p', userInput]);

// ❌ 错误：字符串拼接
spawn('claude', `-p "${userInput}"`);
```

### 2. 环境变量保护

```javascript
// 日志中隐藏 API 密钥
console.log('API Key:', apiKey ? '***' : 'not set');
```

### 3. 路径验证

```javascript
// 验证项目路径在允许的范围内
const projectPath = path.resolve(options.projectPath);
if (!projectPath.startsWith(allowedBasePath)) {
  throw new Error('Invalid project path');
}
```

### 4. 进程权限限制

```javascript
// 使用最小权限运行进程
spawn('claude', args, {
  uid: processUid,
  gid: processGid
});
```

## 部署和配置

### 环境变量配置

**开发环境：**
```bash
# .env 文件
ANTHROPIC_BASE_URL=http://localhost:8082
ANTHROPIC_API_KEY=any-value
```

**生产环境：**
```bash
# 系统环境变量
export ANTHROPIC_BASE_URL=https://proxy.example.com
export ANTHROPIC_API_KEY=your-api-key
```

**Docker 部署：**
```dockerfile
ENV ANTHROPIC_BASE_URL=http://proxy:8082
ENV ANTHROPIC_API_KEY=any-value
```

### Claude CLI 安装

```bash
# 安装 Claude CLI
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

## 监控和日志

### 日志级别

```javascript
// INFO: 进程启动和终止
console.log('[Claude Proxy] Starting process for session:', sessionId);

// DEBUG: 详细输出
if (process.env.DEBUG) {
  console.log('[Claude Proxy] Raw output:', rawOutput);
}

// ERROR: 错误和异常
console.error('[Claude Proxy] Process error:', error);
```

### 监控指标

- 活动进程数量
- 进程启动/终止频率
- 平均响应时间
- 错误率
- 环境变量配置状态

## 向后兼容

### 保持现有功能

- Claude SDK 提供商保持不变
- 不修改现有的 `claude-sdk.js`
- 共享项目和会话管理逻辑
- 共享文件浏览器和 Git 集成

### 提供商切换

```javascript
// 提供商配置
const providers = {
  'claude': { name: 'Claude SDK', available: true },
  'claude-proxy': { name: 'Claude Code Proxy', available: proxyConfigured },
  'cursor': { name: 'Cursor CLI', available: true },
  'codex': { name: 'Codex', available: true }
};
```

### 会话隔离

- 不同提供商的会话独立存储
- 会话 ID 包含提供商前缀（可选）
- 会话元数据包含提供商信息

## 未来扩展

### 1. 高级配置

- 支持更多 Claude CLI 参数
- 自定义系统提示
- 工具权限细粒度控制
- MCP 服务器集成

### 2. 性能优化

- 进程池管理
- 智能预热
- 缓存优化
- 并发控制

### 3. 监控和分析

- 使用统计
- 性能指标
- 错误追踪
- 成本分析

### 4. 企业功能

- 多租户支持
- 审计日志
- 配额管理
- 访问控制
