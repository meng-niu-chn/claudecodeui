# 产品需求文档 - Claude Code UI

## 简介

Claude Code UI 是一个跨平台的 Web 应用程序，为 Claude Code CLI、Cursor CLI 和 OpenAI Codex 提供统一的图形用户界面。该系统使开发者能够通过桌面和移动设备访问 AI 编程助手，提供完整的项目管理、会话管理、文件编辑和实时协作功能。

## 术语表

- **System**: Claude Code UI 应用程序
- **User**: 使用该应用程序的开发者
- **Project**: 代码项目，包含源代码文件和会话历史
- **Session**: 与 AI 助手的对话会话
- **Provider**: AI 服务提供商（Claude、Cursor 或 Codex）
- **WebSocket**: 实时双向通信协议
- **PTY**: 伪终端（Pseudo-Terminal）
- **TaskMaster**: 可选的 AI 驱动项目管理集成
- **MCP**: Model Context Protocol，模型上下文协议

## 需求

### 需求 1：多 AI 提供商支持

**用户故事：** 作为开发者，我希望能够在 Claude Code、Cursor CLI 和 Codex 之间切换，以便根据不同的任务选择最合适的 AI 助手。

#### 验收标准

1. THE System SHALL 支持 Claude Code CLI 作为 AI 提供商
2. THE System SHALL 支持 Cursor CLI 作为 AI 提供商
3. THE System SHALL 支持 OpenAI Codex 作为 AI 提供商
4. WHEN 用户选择 AI 提供商 THEN THE System SHALL 保存用户的选择偏好
5. WHEN 用户切换提供商 THEN THE System SHALL 保持当前项目和会话状态

### 需求 2：项目管理

**用户故事：** 作为开发者，我希望能够管理多个代码项目，以便组织和访问不同的开发工作。

#### 验收标准

1. THE System SHALL 自动发现 Claude Code 项目目录
2. WHEN 用户添加新项目 THEN THE System SHALL 验证项目路径的有效性
3. THE System SHALL 显示每个项目的会话数量和元数据
4. WHEN 用户重命名项目 THEN THE System SHALL 更新项目显示名称
5. WHEN 用户删除空项目 THEN THE System SHALL 移除项目记录
6. THE System SHALL 实时监控项目目录的文件变化

### 需求 3：会话管理

**用户故事：** 作为开发者，我希望能够创建、恢复和管理与 AI 的对话会话，以便继续之前的工作或开始新的任务。

#### 验收标准

1. WHEN 用户创建新会话 THEN THE System SHALL 生成唯一的会话标识符
2. THE System SHALL 保存会话的完整消息历史
3. WHEN 用户选择现有会话 THEN THE System SHALL 加载该会话的消息历史
4. WHEN 用户删除会话 THEN THE System SHALL 移除会话文件和记录
5. THE System SHALL 支持会话的暂停和恢复功能
6. WHEN 会话处于活动状态 THEN THE System SHALL 防止自动项目更新干扰对话

### 需求 4：实时通信

**用户故事：** 作为开发者，我希望能够实时接收 AI 的响应，以便获得流畅的交互体验。

#### 验收标准

1. THE System SHALL 使用 WebSocket 协议进行实时通信
2. WHEN AI 生成响应 THEN THE System SHALL 流式传输响应内容
3. THE System SHALL 支持消息的增量更新
4. WHEN 连接断开 THEN THE System SHALL 尝试自动重新连接
5. THE System SHALL 在连接状态变化时通知用户

### 需求 5：文件管理

**用户故事：** 作为开发者，我希望能够浏览、查看和编辑项目文件，以便在不离开应用的情况下修改代码。

#### 验收标准

1. THE System SHALL 显示项目的文件树结构
2. WHEN 用户选择文件 THEN THE System SHALL 加载并显示文件内容
3. THE System SHALL 支持语法高亮显示
4. WHEN 用户编辑文件 THEN THE System SHALL 保存更改到磁盘
5. THE System SHALL 支持二进制文件（如图片）的查看
6. THE System SHALL 限制文件访问在项目根目录内

### 需求 6：Git 集成

**用户故事：** 作为开发者，我希望能够查看和管理 Git 变更，以便进行版本控制操作。

#### 验收标准

1. THE System SHALL 显示当前分支信息
2. THE System SHALL 显示未暂存和已暂存的文件变更
3. WHEN 用户暂存文件 THEN THE System SHALL 将文件添加到 Git 暂存区
4. WHEN 用户提交变更 THEN THE System SHALL 创建 Git 提交
5. THE System SHALL 支持分支切换功能
6. THE System SHALL 显示文件的差异对比

### 需求 7：身份验证和安全

**用户故事：** 作为系统管理员，我希望能够保护应用访问，以便确保只有授权用户可以使用系统。

#### 验收标准

1. WHEN 系统首次启动 THEN THE System SHALL 要求创建管理员账户
2. THE System SHALL 使用 bcrypt 加密存储密码
3. WHEN 用户登录 THEN THE System SHALL 验证凭据并生成 JWT 令牌
4. THE System SHALL 在所有 API 请求中验证 JWT 令牌
5. WHEN 令牌过期 THEN THE System SHALL 要求用户重新登录
6. THE System SHALL 支持可选的 API 密钥验证

### 需求 8：响应式设计

**用户故事：** 作为移动设备用户，我希望能够在手机和平板上使用应用，以便随时随地进行开发工作。

#### 验收标准

1. THE System SHALL 在桌面、平板和移动设备上正确显示
2. WHEN 屏幕宽度小于 768px THEN THE System SHALL 切换到移动布局
3. THE System SHALL 在移动设备上提供触摸友好的导航
4. THE System SHALL 支持 PWA（渐进式 Web 应用）功能
5. WHEN 用户添加到主屏幕 THEN THE System SHALL 作为独立应用运行

### 需求 9：终端集成

**用户故事：** 作为开发者，我希望能够访问集成的终端，以便直接执行命令和脚本。

#### 验收标准

1. THE System SHALL 提供交互式终端界面
2. THE System SHALL 使用 PTY（伪终端）支持完整的终端功能
3. WHEN 用户在终端中输入命令 THEN THE System SHALL 执行命令并显示输出
4. THE System SHALL 支持终端会话的持久化
5. THE System SHALL 在 30 分钟不活动后清理终端会话

### 需求 10：工具权限管理

**用户故事：** 作为用户，我希望能够控制 AI 可以使用哪些工具，以便确保安全性和控制自动化操作。

#### 验收标准

1. THE System SHALL 默认禁用所有 AI 工具
2. WHEN 用户启用工具 THEN THE System SHALL 保存工具权限设置
3. THE System SHALL 在 AI 使用工具前请求用户批准
4. WHEN 用户拒绝工具使用 THEN THE System SHALL 阻止该操作
5. THE System SHALL 支持"记住我的选择"功能

### 需求 11：TaskMaster 集成（可选）

**用户故事：** 作为项目经理，我希望能够使用 AI 驱动的任务管理，以便自动化项目规划和任务分解。

#### 验收标准

1. WHEN TaskMaster 已安装 THEN THE System SHALL 检测并启用集成
2. THE System SHALL 支持从 PRD 生成任务
3. THE System SHALL 显示任务看板视图
4. WHEN 用户更新任务状态 THEN THE System SHALL 保存任务进度
5. THE System SHALL 通过 WebSocket 实时同步任务更新

### 需求 12：MCP 服务器管理

**用户故事：** 作为开发者，我希望能够管理 MCP（Model Context Protocol）服务器，以便扩展 AI 的功能。

#### 验收标准

1. THE System SHALL 显示已配置的 MCP 服务器列表
2. WHEN 用户添加 MCP 服务器 THEN THE System SHALL 验证配置
3. THE System SHALL 支持启用和禁用 MCP 服务器
4. THE System SHALL 显示 MCP 服务器的连接状态
5. WHEN MCP 配置更改 THEN THE System SHALL 自动重新连接服务器

### 需求 13：版本更新管理

**用户故事：** 作为用户，我希望能够收到版本更新通知，以便保持应用程序最新。

#### 验收标准

1. THE System SHALL 定期检查 GitHub 上的新版本
2. WHEN 新版本可用 THEN THE System SHALL 显示更新通知
3. THE System SHALL 显示版本更新日志
4. WHEN 用户触发更新 THEN THE System SHALL 执行更新命令
5. THE System SHALL 在更新完成后提示用户重启服务器

### 需求 14：会话保护系统

**用户故事：** 作为用户，我希望在与 AI 对话期间不被自动更新打断，以便保持对话的连续性。

#### 验收标准

1. WHEN 用户发送消息 THEN THE System SHALL 标记会话为活动状态
2. WHILE 会话处于活动状态 THEN THE System SHALL 暂停项目自动更新
3. WHEN 对话完成或中止 THEN THE System SHALL 恢复项目更新
4. THE System SHALL 支持临时会话标识符的保护
5. WHEN 收到真实会话 ID THEN THE System SHALL 替换临时标识符

### 需求 15：多用户支持

**用户故事：** 作为系统管理员，我希望能够支持多个用户账户，以便团队成员可以独立使用系统。

#### 验收标准

1. THE System SHALL 支持多个用户账户的创建
2. WHEN 用户注册 THEN THE System SHALL 创建独立的用户配置文件
3. THE System SHALL 为每个用户隔离会话和项目数据
4. THE System SHALL 支持用户的入职流程
5. WHEN 用户完成入职 THEN THE System SHALL 标记入职状态为已完成
