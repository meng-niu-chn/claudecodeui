# Claude Code Proxy 实现指南

## 快速开始

本指南将帮助您快速实现 Claude Code Proxy 功能。

## 前置条件

1. **环境变量配置**
   ```bash
   export ANTHROPIC_BASE_URL=http://localhost:8082
   export ANTHROPIC_API_KEY=any-value
   ```

2. **Claude CLI 安装**
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude --version
   ```

## 核心文件

### 1. server/claude-code-proxy.js（新建）

这是核心实现文件，参考 `server/cursor-cli.js` 的结构：

```javascript
import { spawn } from 'child_process';
import crossSpawn from 'cross-spawn';

const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;
let activeClaudeProxyProcesses = new Map();

// 主函数：启动 Claude CLI 进程
async function spawnClaudeProxy(command, options = {}, ws) {
  // 1. 构建命令参数
  // 2. 启动子进程
  // 3. 处理 stdout（流式输出）
  // 4. 处理 stderr（错误输出）
  // 5. 处理进程事件（close, error）
  // 6. 管理进程引用
}

// 辅助函数
function checkProxyConfiguration() { /* ... */ }
function checkClaudeCLI() { /* ... */ }
function buildClaudeArgs(command, options) { /* ... */ }
function abortClaudeProxySession(sessionId) { /* ... */ }
function isClaudeProxySessionActive(sessionId) { /* ... */ }
function getActiveClaudeProxySessions() { /* ... */ }

export {
  spawnClaudeProxy,
  abortClaudeProxySession,
  isClaudeProxySessionActive,
  getActiveClaudeProxySessions,
  checkProxyConfiguration,
  checkClaudeCLI
};
```

### 2. server/routes/claude-proxy.js（新建）

API 路由文件：

```javascript
import express from 'express';
import { checkProxyConfiguration, checkClaudeCLI } from '../claude-code-proxy.js';

const router = express.Router();

// GET /api/claude-proxy/status
router.get('/status', async (req, res) => {
  try {
    const proxyConfig = checkProxyConfiguration();
    const cliInstalled = await checkClaudeCLI();
    
    res.json({
      available: proxyConfig.configured && cliInstalled,
      baseUrl: proxyConfig.baseUrl,
      hasApiKey: proxyConfig.hasApiKey,
      cliInstalled,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message
    });
  }
});

export default router;
```

### 3. server/index.js（修改）

在 `handleChatConnection` 函数中添加：

```javascript
import { spawnClaudeProxy, abortClaudeProxySession } from './claude-code-proxy.js';
import claudeProxyRoutes from './routes/claude-proxy.js';

// 注册路由
app.use('/api/claude-proxy', authenticateToken, claudeProxyRoutes);

// 在 handleChatConnection 中添加
function handleChatConnection(ws) {
  // ... 现有代码 ...
  
  ws.on('message', async (message) => {
    const data = JSON.parse(message);
    
    // 添加 Claude Proxy 处理
    if (data.type === 'claude-proxy-command') {
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
    // ... 现有代码 ...
  });
}
```

### 4. 前端修改

#### src/hooks/useClaudeProxyStatus.js（新建）

```javascript
import { useState, useEffect } from 'react';
import { authenticatedFetch } from '../utils/api';

export function useClaudeProxyStatus() {
  const [status, setStatus] = useState({
    available: false,
    loading: true
  });
  
  useEffect(() => {
    authenticatedFetch('/api/claude-proxy/status')
      .then(res => res.json())
      .then(data => setStatus({ ...data, loading: false }))
      .catch(() => setStatus({ available: false, loading: false }));
  }, []);
  
  return status;
}
```

#### 提供商选择器（修改现有组件）

```javascript
import { useClaudeProxyStatus } from '../hooks/useClaudeProxyStatus';

function ProviderSelector() {
  const proxyStatus = useClaudeProxyStatus();
  
  const providers = [
    { id: 'claude', name: 'Claude SDK', available: true },
    { id: 'claude-proxy', name: 'Claude Code Proxy', available: proxyStatus.available },
    { id: 'cursor', name: 'Cursor CLI', available: true },
    { id: 'codex', name: 'Codex', available: true }
  ];
  
  // ... 渲染逻辑 ...
}
```

#### ChatInterface.jsx（修改）

```javascript
const handleSendMessage = () => {
  const provider = localStorage.getItem('selected-provider') || 'claude';
  
  if (provider === 'claude-proxy') {
    sendMessage({
      type: 'claude-proxy-command',
      command: userMessage,
      options: {
        projectPath: selectedProject?.fullPath,
        sessionId: selectedSession?.id,
        model: selectedModel
      }
    });
  }
  // ... 其他提供商处理 ...
};
```

## 实现步骤

### 阶段 1：核心功能（1-2 天）

1. ✅ 创建 `server/claude-code-proxy.js`
2. ✅ 实现环境变量检测
3. ✅ 实现命令参数构建
4. ✅ 实现进程启动和管理
5. ✅ 实现输出解析和消息转换

### 阶段 2：API 集成（1 天）

1. ✅ 创建 `server/routes/claude-proxy.js`
2. ✅ 实现状态检测端点
3. ✅ 修改 `server/index.js` 添加路由和消息处理

### 阶段 3：前端集成（1-2 天）

1. ✅ 创建 `useClaudeProxyStatus` Hook
2. ✅ 修改提供商选择器
3. ✅ 修改 `ChatInterface` 消息发送逻辑
4. ✅ 添加配置界面

### 阶段 4：测试和优化（1-2 天）

1. ✅ 编写单元测试
2. ✅ 编写集成测试
3. ✅ 手动测试
4. ✅ 性能优化
5. ✅ 文档更新

## 关键实现细节

### 1. 命令参数构建

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
  
  // 跳过权限（可选）
  if (options.skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }
  
  return args;
}
```

### 2. 输出解析

```javascript
cursorProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      
      switch (response.type) {
        case 'system':
          if (response.subtype === 'init') {
            capturedSessionId = response.session_id;
            ws.send({
              type: 'session-created',
              sessionId: capturedSessionId,
              model: response.model
            });
          }
          break;
          
        case 'assistant':
          const textContent = response.message.content[0].text;
          ws.send({
            type: 'claude-response',
            data: {
              type: 'content_block_delta',
              delta: { type: 'text_delta', text: textContent }
            }
          });
          break;
          
        case 'result':
          ws.send({
            type: 'claude-complete',
            sessionId: capturedSessionId,
            success: response.subtype === 'success'
          });
          break;
      }
    } catch (error) {
      // 非 JSON 输出
      ws.send({ type: 'claude-proxy-output', data: line });
    }
  }
});
```

### 3. 进程管理

```javascript
// 存储进程引用
const processKey = capturedSessionId || Date.now().toString();
activeClaudeProxyProcesses.set(processKey, claudeProcess);

// 清理进程
claudeProcess.on('close', (code) => {
  activeClaudeProxyProcesses.delete(capturedSessionId || processKey);
  ws.send({
    type: 'claude-complete',
    sessionId: capturedSessionId,
    exitCode: code
  });
});

// 中止进程
function abortClaudeProxySession(sessionId) {
  const process = activeClaudeProxyProcesses.get(sessionId);
  if (process) {
    process.kill('SIGTERM');
    activeClaudeProxyProcesses.delete(sessionId);
    return true;
  }
  return false;
}
```

## 测试

### 单元测试示例

```javascript
import { buildClaudeArgs, checkProxyConfiguration } from '../server/claude-code-proxy.js';

describe('Claude Code Proxy', () => {
  test('buildClaudeArgs - new session', () => {
    const args = buildClaudeArgs('Hello', { model: 'sonnet' });
    expect(args).toContain('-p');
    expect(args).toContain('Hello');
    expect(args).toContain('--model');
    expect(args).toContain('sonnet');
    expect(args).toContain('--output-format');
    expect(args).toContain('stream-json');
  });
  
  test('buildClaudeArgs - resume session', () => {
    const args = buildClaudeArgs('Continue', { sessionId: 'abc-123' });
    expect(args).toContain('--resume');
    expect(args).toContain('abc-123');
    expect(args).not.toContain('--model');
  });
  
  test('checkProxyConfiguration - configured', () => {
    process.env.ANTHROPIC_BASE_URL = 'http://localhost:8082';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    
    const config = checkProxyConfiguration();
    expect(config.available).toBe(true);
    expect(config.baseUrl).toBe('http://localhost:8082');
    expect(config.hasApiKey).toBe(true);
  });
});
```

### 集成测试示例

```javascript
describe('Claude Proxy Integration', () => {
  test('complete conversation flow', async () => {
    const mockWs = {
      send: jest.fn(),
      setSessionId: jest.fn()
    };
    
    await spawnClaudeProxy('Hello', {}, mockWs);
    
    // 验证会话创建
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'session-created' })
    );
    
    // 验证响应发送
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'claude-response' })
    );
  });
});
```

## 故障排除

### 问题 1：环境变量未生效

**症状：** Claude Code Proxy 选项不可用

**解决方案：**
```bash
# 检查环境变量
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_API_KEY

# 重启服务器
npm run server
```

### 问题 2：Claude CLI 未找到

**症状：** 错误提示 "claude: command not found"

**解决方案：**
```bash
# 安装 Claude CLI
npm install -g @anthropic-ai/claude-code

# 验证安装
which claude
claude --version
```

### 问题 3：代理服务器连接失败

**症状：** 错误提示连接被拒绝

**解决方案：**
```bash
# 检查代理服务器是否运行
curl http://localhost:8082

# 检查防火墙设置
# 检查代理服务器日志
```

### 问题 4：输出解析失败

**症状：** 消息显示异常或不完整

**解决方案：**
- 启用调试模式：`DEBUG=* npm run server`
- 检查 Claude CLI 输出格式
- 验证 `--output-format stream-json` 参数

## 参考资源

- **Cursor CLI 实现：** `server/cursor-cli.js`
- **Claude CLI 文档：** 运行 `claude --help`
- **需求文档：** `.kiro/specs/claude-code-proxy/requirements.md`
- **设计文档：** `.kiro/specs/claude-code-proxy/design.md`
- **任务列表：** `.kiro/specs/claude-code-proxy/tasks.md`

## 下一步

1. 阅读需求文档和设计文档
2. 查看 `server/cursor-cli.js` 了解实现模式
3. 按照任务列表逐步实现
4. 编写测试确保质量
5. 更新文档

祝您实现顺利！🚀
