# 需求文档 - Claude Code Proxy 集成

## 简介

为 Claude Code UI 添加一个新的 AI 提供商选项：Claude Code Proxy。该提供商通过 Claude CLI 命令行工具与代理服务器通信，允许用户通过自定义的代理服务（如本地代理或企业代理）访问 Claude API，而不是直接使用 Claude SDK。

## 术语表

- **Claude_Code_Proxy**: 通过 Claude CLI 和代理服务器访问 Claude API 的提供商
- **Claude_CLI**: Claude 官方命令行工具
- **Proxy_Server**: 代理服务器，拦截和转发 Claude API 请求
- **Environment_Variables**: 环境变量，用于配置代理服务器地址和 API 密钥
- **Provider**: AI 服务提供商（Claude SDK、Claude Code Proxy、Cursor、Codex）
- **Session**: 与 AI 的对话会话
- **System**: Claude Code UI 应用程序

## 需求

### 需求 1：环境变量配置

**用户故事：** 作为开发者，我希望能够通过环境变量配置 Claude 代理服务器，以便使用自定义的代理服务访问 Claude API。

#### 验收标准

1. THE System SHALL 读取 `ANTHROPIC_BASE_URL` 环境变量作为代理服务器地址
2. THE System SHALL 读取 `ANTHROPIC_API_KEY` 环境变量作为 API 密钥
3. WHEN 两个环境变量都存在 THEN THE System SHALL 启用 Claude Code Proxy 提供商选项
4. WHEN 任一环境变量缺失 THEN THE System SHALL 禁用 Claude Code Proxy 提供商选项
5. THE System SHALL 在设置界面显示环境变量的配置状态

### 需求 2：Claude CLI 集成

**用户故事：** 作为开发者，我希望系统能够通过 Claude CLI 与代理服务器通信，以便利用命令行工具的功能。

#### 验收标准

1. THE System SHALL 使用 `claude` 命令行工具执行对话
2. THE System SHALL 传递环境变量到 Claude CLI 进程
3. WHEN 用户发送消息 THEN THE System SHALL 调用 `claude` 命令并传递用户输入
4. THE System SHALL 捕获 Claude CLI 的标准输出和标准错误
5. THE System SHALL 解析 Claude CLI 的输出并转换为统一的消息格式

### 需求 3：进程管理

**用户故事：** 作为系统管理员，我希望系统能够正确管理 Claude CLI 进程，以便避免资源泄漏和进程僵尸。

#### 验收标准

1. THE System SHALL 为每个会话创建独立的 Claude CLI 进程
2. WHEN 会话结束 THEN THE System SHALL 终止对应的 Claude CLI 进程
3. WHEN 用户中止会话 THEN THE System SHALL 立即终止 Claude CLI 进程
4. THE System SHALL 跟踪所有活动的 Claude CLI 进程
5. THE System SHALL 在服务器关闭时清理所有 Claude CLI 进程

### 需求 4：会话管理

**用户故事：** 作为用户，我希望能够创建、恢复和管理 Claude Code Proxy 会话，以便继续之前的对话。

#### 验收标准

1. WHEN 用户创建新会话 THEN THE System SHALL 生成唯一的会话标识符
2. THE System SHALL 将会话消息保存到 JSONL 文件
3. WHEN 用户选择现有会话 THEN THE System SHALL 加载历史消息
4. THE System SHALL 支持会话的暂停和恢复
5. WHEN 用户恢复会话 THEN THE System SHALL 传递会话上下文到 Claude CLI

### 需求 5：消息流式传输

**用户故事：** 作为用户，我希望能够实时看到 Claude 的响应，以便获得流畅的交互体验。

#### 验收标准

1. THE System SHALL 实时捕获 Claude CLI 的输出
2. WHEN Claude CLI 输出内容 THEN THE System SHALL 立即通过 WebSocket 发送到客户端
3. THE System SHALL 支持增量消息更新
4. THE System SHALL 正确处理多行输出
5. THE System SHALL 保持输出的格式和换行符

### 需求 6：错误处理

**用户故事：** 作为用户，我希望系统能够优雅地处理错误，以便了解问题并采取相应措施。

#### 验收标准

1. WHEN Claude CLI 不存在 THEN THE System SHALL 显示安装提示
2. WHEN 代理服务器不可达 THEN THE System SHALL 显示连接错误
3. WHEN API 密钥无效 THEN THE System SHALL 显示认证错误
4. WHEN Claude CLI 崩溃 THEN THE System SHALL 捕获错误并通知用户
5. THE System SHALL 记录所有错误到服务器日志

### 需求 7：提供商切换

**用户故事：** 作为用户，我希望能够在不同的 AI 提供商之间切换，以便根据需要选择最合适的服务。

#### 验收标准

1. THE System SHALL 在提供商列表中显示 Claude Code Proxy 选项
2. WHEN 环境变量配置正确 THEN THE System SHALL 启用 Claude Code Proxy 选项
3. WHEN 用户选择 Claude Code Proxy THEN THE System SHALL 保存选择偏好
4. THE System SHALL 在 UI 中显示当前选择的提供商
5. WHEN 用户切换提供商 THEN THE System SHALL 保持当前项目和会话状态

### 需求 8：命令行参数支持

**用户故事：** 作为开发者，我希望系统能够使用 Claude CLI 的各种参数，以便自定义对话行为。

#### 验收标准

1. THE System SHALL 支持 `--project` 参数指定项目路径
2. THE System SHALL 支持 `--session` 参数恢复会话
3. THE System SHALL 支持 `--model` 参数选择模型
4. THE System SHALL 支持 `--continue` 参数继续对话
5. THE System SHALL 支持其他 Claude CLI 支持的参数

### 需求 9：输出解析

**用户故事：** 作为系统开发者，我希望能够正确解析 Claude CLI 的输出，以便提取消息、工具调用和其他元数据。

#### 验收标准

1. THE System SHALL 识别用户消息和助手消息
2. THE System SHALL 解析工具调用信息
3. THE System SHALL 解析工具结果
4. THE System SHALL 识别会话 ID 和元数据
5. THE System SHALL 处理 ANSI 颜色代码和格式化字符

### 需求 10：兼容性

**用户故事：** 作为用户，我希望 Claude Code Proxy 与现有功能兼容，以便无缝使用所有功能。

#### 验收标准

1. THE System SHALL 使用与其他提供商相同的 WebSocket 协议
2. THE System SHALL 使用与其他提供商相同的消息格式
3. THE System SHALL 支持会话保护系统
4. THE System SHALL 支持工具权限管理
5. THE System SHALL 与文件浏览器、Git 集成等功能兼容

### 需求 11：性能优化

**用户故事：** 作为用户，我希望 Claude Code Proxy 具有良好的性能，以便获得流畅的使用体验。

#### 验收标准

1. THE System SHALL 使用流式处理避免缓冲延迟
2. THE System SHALL 复用 Claude CLI 进程以减少启动开销
3. THE System SHALL 使用异步 I/O 处理进程输出
4. THE System SHALL 限制并发 Claude CLI 进程数量
5. THE System SHALL 在空闲时清理未使用的进程

### 需求 12：调试和日志

**用户故事：** 作为开发者，我希望能够查看详细的调试信息，以便排查问题。

#### 验收标准

1. THE System SHALL 记录所有 Claude CLI 命令调用
2. THE System SHALL 记录环境变量配置状态
3. THE System SHALL 记录进程启动和终止事件
4. THE System SHALL 记录所有错误和异常
5. THE System SHALL 支持调试模式输出详细日志

### 需求 13：安全性

**用户故事：** 作为系统管理员，我希望系统能够安全地处理敏感信息，以便保护用户数据。

#### 验收标准

1. THE System SHALL 不在日志中记录完整的 API 密钥
2. THE System SHALL 验证代理服务器 URL 的格式
3. THE System SHALL 限制 Claude CLI 进程的权限
4. THE System SHALL 防止命令注入攻击
5. THE System SHALL 使用安全的进程间通信

### 需求 14：配置界面

**用户故事：** 作为用户，我希望能够在 UI 中查看和配置 Claude Code Proxy 设置，以便方便地管理配置。

#### 验收标准

1. THE System SHALL 在设置界面显示 Claude Code Proxy 配置部分
2. THE System SHALL 显示当前的环境变量配置状态
3. THE System SHALL 显示代理服务器连接状态
4. THE System SHALL 提供测试连接功能
5. THE System SHALL 显示配置帮助文档链接

### 需求 15：向后兼容

**用户故事：** 作为现有用户，我希望新功能不会破坏现有的 Claude SDK 集成，以便继续使用原有功能。

#### 验收标准

1. THE System SHALL 保持现有的 Claude SDK 提供商功能
2. THE System SHALL 允许用户在 Claude SDK 和 Claude Code Proxy 之间切换
3. THE System SHALL 独立管理两个提供商的会话
4. THE System SHALL 不修改现有的 Claude SDK 代码逻辑
5. THE System SHALL 在两个提供商之间共享项目和文件管理功能
