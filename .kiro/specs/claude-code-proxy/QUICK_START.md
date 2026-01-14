# Claude Code Proxy - 快速开始

## 🚀 5 分钟快速测试

### 1. 配置环境变量

编辑项目根目录的 `.env` 文件，添加：

```bash
ANTHROPIC_BASE_URL=http://localhost:8082
ANTHROPIC_API_KEY=any-value
```

### 2. 验证 Claude CLI

```bash
claude --version
```

如果未安装，请访问 Claude CLI 官方文档进行安装。

### 3. 启动代理服务器

确保你的代理服务器正在运行并监听 `http://localhost:8082`。

### 4. 启动应用

```bash
npm start
```

### 5. 测试功能

1. 打开浏览器访问应用
2. 在聊天界面底部，点击 "Claude Code Proxy" 按钮
3. 输入消息并发送
4. 观察 Claude 的响应

## ✅ 验证清单

- [ ] 环境变量已配置
- [ ] Claude CLI 已安装
- [ ] 代理服务器正在运行
- [ ] 应用已启动
- [ ] "Claude Code Proxy" 按钮可见
- [ ] 可以发送消息并收到响应

## 📁 实现文件

### 后端
- `server/claude-code-proxy.js` - 核心模块
- `server/routes/claude-proxy.js` - API 路由
- `server/index.js` - WebSocket 集成（已修改）

### 前端
- `src/hooks/useClaudeProxyStatus.js` - 状态检测 Hook
- `src/components/ChatInterface.jsx` - UI 集成（已修改）

### 文档
- `requirements.md` - 需求文档
- `design.md` - 设计文档
- `tasks.md` - 任务清单
- `IMPLEMENTATION_GUIDE.md` - 实现指南
- `TESTING_GUIDE.md` - 测试指南
- `COMPLETION_SUMMARY.md` - 完成总结
- `QUICK_START.md` - 本文档

## 🔍 故障排除

### 问题：Claude Code Proxy 按钮不显示

**检查**：
```bash
# 访问状态端点
curl http://localhost:3000/api/claude-proxy/status
```

**预期响应**：
```json
{
  "available": true,
  "configured": true,
  "baseUrl": "http://localhost:8082",
  "hasApiKey": true,
  "cliInstalled": true
}
```

### 问题：发送消息后无响应

**检查服务器日志**：
```
[Claude Proxy] Spawning Claude CLI: claude --resume <session-id> -p <message> --output-format stream-json
[Claude Proxy] Working directory: /path/to/project
```

**常见原因**：
- 代理服务器未运行
- `ANTHROPIC_BASE_URL` 配置错误
- Claude CLI 未正确安装

## 📚 更多信息

- 详细测试步骤：`TESTING_GUIDE.md`
- 实现细节：`IMPLEMENTATION_GUIDE.md`
- 完整功能列表：`COMPLETION_SUMMARY.md`
- 任务进度：`tasks.md`

## 🎯 核心特性

✅ **环境变量配置** - 通过 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_API_KEY` 配置代理  
✅ **自动检测** - 仅在配置可用时显示选项  
✅ **会话管理** - 自动创建和恢复会话  
✅ **流式响应** - 实时显示 Claude 的响应  
✅ **完全隔离** - 不影响现有 Claude SDK 功能  
✅ **工具支持** - 支持所有 Claude 工具（Read, Write, Edit, Bash 等）  

开始测试吧！🎉
