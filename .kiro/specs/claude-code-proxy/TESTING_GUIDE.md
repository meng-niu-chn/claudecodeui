# Claude Code Proxy - 测试指南

## 实现状态

✅ **核心实现已完成**

所有核心功能已实现并通过语法检查：
- ✅ 后端核心模块 (`server/claude-code-proxy.js`)
- ✅ API 路由 (`server/routes/claude-proxy.js`)
- ✅ WebSocket 集成 (`server/index.js`)
- ✅ 前端状态检测 Hook (`src/hooks/useClaudeProxyStatus.js`)
- ✅ 前端 UI 集成 (`src/components/ChatInterface.jsx`)

## 测试前准备

### 1. 安装 Claude CLI

```bash
# 检查是否已安装
claude --version

# 如果未安装，请访问 Claude CLI 官方文档进行安装
```

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加：

```bash
ANTHROPIC_BASE_URL=http://localhost:8082
ANTHROPIC_API_KEY=any-value
```

**注意**：
- `ANTHROPIC_BASE_URL` 应指向你的代理服务器地址
- `ANTHROPIC_API_KEY` 可以是任意值（代理服务器会处理实际认证）

### 3. 启动代理服务器

确保你的代理服务器正在运行并监听配置的端口（例如 8082）。

## 测试步骤

### 步骤 1: 验证后端配置

启动服务器后，访问状态检测端点：

```bash
# 启动服务器
npm start

# 在另一个终端检查状态
curl http://localhost:3000/api/claude-proxy/status
```

预期响应：
```json
{
  "available": true,
  "configured": true,
  "baseUrl": "http://localhost:8082",
  "hasApiKey": true,
  "cliInstalled": true
}
```

### 步骤 2: 测试前端 UI

1. 打开浏览器访问应用
2. 在聊天界面底部的提供商选择器中，应该能看到 "Claude Code Proxy" 按钮
3. 点击 "Claude Code Proxy" 按钮切换提供商
4. 按钮应该高亮显示，表示已选中

### 步骤 3: 测试新会话创建

1. 确保已选择 "Claude Code Proxy" 提供商
2. 在输入框中输入一条消息，例如："Hello, can you help me?"
3. 点击发送按钮

**预期行为**：
- 消息发送后，应该看到 "Thinking..." 加载状态
- Claude CLI 进程应该启动
- 应该收到 Claude 的响应
- 响应应该以流式方式显示（逐字显示）
- 会话 ID 应该自动生成并保存

### 步骤 4: 测试会话恢复

1. 在已有会话中继续发送消息
2. 新消息应该使用相同的会话 ID
3. Claude 应该能够记住之前的对话内容

### 步骤 5: 测试提供商切换

1. 切换到其他提供商（例如 "Claude SDK"）
2. 发送消息，验证使用的是 Claude SDK
3. 切换回 "Claude Code Proxy"
4. 发送消息，验证使用的是 Claude Proxy
5. 每个提供商的会话应该独立管理

## 调试技巧

### 查看服务器日志

服务器会输出详细的日志信息：

```
[Claude Proxy] Spawning Claude CLI: claude --resume <session-id> -p <message> --output-format stream-json
[Claude Proxy] Working directory: /path/to/project
[Claude Proxy] Session info - Input sessionId: <session-id>
[Claude Proxy] stdout: {"type":"system","subtype":"init",...}
[Claude Proxy] Parsed JSON: {...}
[Claude Proxy] Captured session ID: <session-id>
```

### 常见问题排查

#### 1. Claude Code Proxy 按钮不显示

**原因**：环境变量未配置或 Claude CLI 未安装

**解决方案**：
- 检查 `.env` 文件中的环境变量
- 运行 `claude --version` 验证 CLI 安装
- 检查 `/api/claude-proxy/status` 端点响应

#### 2. 发送消息后无响应

**原因**：代理服务器未运行或不可达

**解决方案**：
- 确认代理服务器正在运行
- 检查 `ANTHROPIC_BASE_URL` 是否正确
- 查看服务器日志中的错误信息

#### 3. 会话无法恢复

**原因**：会话 ID 未正确保存或传递

**解决方案**：
- 检查浏览器控制台是否有错误
- 查看服务器日志中的会话 ID
- 确认 WebSocket 连接正常

#### 4. 进程未正确清理

**原因**：进程管理逻辑问题

**解决方案**：
- 检查 `activeClaudeProxyProcesses` Map
- 手动终止僵尸进程：`ps aux | grep claude`
- 重启服务器

## 浏览器控制台调试

打开浏览器开发者工具，在控制台中可以看到：

```javascript
// 检查当前提供商
localStorage.getItem('selected-provider')
// 应该返回: "claude-proxy"

// 检查 Claude Proxy 状态
// 在 Network 标签中查看 /api/claude-proxy/status 请求
```

## WebSocket 消息监控

在浏览器控制台中，可以监控 WebSocket 消息：

```javascript
// 查看发送的消息
{
  type: 'claude-proxy-command',
  command: 'Hello, can you help me?',
  sessionId: '<session-id>',
  projectPath: '/path/to/project',
  model: 'claude-3-5-sonnet-20241022'
}

// 查看接收的消息
{
  type: 'session-created',
  sessionId: '<session-id>',
  model: 'claude-3-5-sonnet-20241022',
  cwd: '/path/to/project'
}

{
  type: 'claude-response',
  data: {
    type: 'content_block_delta',
    delta: {
      type: 'text_delta',
      text: 'Hello! I\'d be happy to help you.'
    }
  }
}

{
  type: 'claude-complete',
  sessionId: '<session-id>',
  success: true,
  isNewSession: true
}
```

## 性能测试

### 响应时间测试

1. 发送简单消息，记录从发送到首字节响应的时间
2. 应该在 1-3 秒内收到首字节响应
3. 完整响应应该以流式方式逐步显示

### 并发测试

1. 在多个标签页中同时打开应用
2. 同时发送消息
3. 验证每个会话独立处理
4. 检查服务器资源使用情况

## 下一步

完成基本测试后，可以考虑：

1. **添加配置 UI**（任务 6）：在设置页面添加 Claude Proxy 配置界面
2. **编写自动化测试**（任务 9-11）：单元测试、集成测试、端到端测试
3. **性能优化**（任务 13）：进程复用、并发控制
4. **更新文档**（任务 12）：README、配置指南、故障排除

## 反馈和问题

如果在测试过程中遇到问题：

1. 查看服务器日志
2. 查看浏览器控制台
3. 检查 WebSocket 连接状态
4. 验证环境变量配置
5. 确认 Claude CLI 和代理服务器正常运行

测试愉快！🚀
