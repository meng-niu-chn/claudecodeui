# 快速消息功能 - 简化版需求

## 📌 需求概述

在聊天界面输入框上方添加**固定的**快速消息按钮，用户点击即可发送预设的常用提示词，无需配置。

---

## 🎨 UI 效果

```
┌─────────────────────────────────────────────────────────┐
│  Chat Interface                                         │
├─────────────────────────────────────────────────────────┤
│  [AI Message]                                           │
│  [User Message]                                         │
├─────────────────────────────────────────────────────────┤
│  [📝 Review Code] [🐛 Find Bugs] [📚 Explain Code]      │  ← 固定快速消息
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐     │
│  │ Type your message...                    [📎] │ [🎤]│
│  └───────────────────────────────────────────────┘ [📤]│
└─────────────────────────────────────────────────────────┘
```

---

## ✨ 功能特性

### 核心功能
- ✅ **固定按钮** - 3-5 个预设的快速消息按钮
- ✅ **一键发送** - 点击按钮立即发送对应消息
- ✅ **响应式** - 桌面显示所有按钮，移动端自适应

### 不包含的功能
- ❌ 用户自定义消息
- ❌ 添加/编辑/删除功能
- ❌ 设置界面
- ❌ 变量支持
- ❌ 智能推荐
- ❌ 服务器同步

---

## 📝 预设消息列表

### 方案 A：代码审查类（推荐）

```javascript
const QUICK_MESSAGES = [
  {
    icon: "📝",
    title: "Review Code",
    message: "Please review this code and suggest improvements."
  },
  {
    icon: "🐛",
    title: "Find Bugs",
    message: "Help me find potential bugs in this code."
  },
  {
    icon: "📚",
    title: "Explain",
    message: "Explain what this code does in simple terms."
  },
  {
    icon: "⚡",
    title: "Optimize",
    message: "How can I optimize this code for better performance?"
  },
  {
    icon: "🧪",
    title: "Add Tests",
    message: "Generate unit tests for this code."
  }
];
```

### 方案 B：通用开发类

```javascript
const QUICK_MESSAGES = [
  {
    icon: "📝",
    title: "Review",
    message: "Please review this code."
  },
  {
    icon: "🐛",
    title: "Debug",
    message: "Help me debug this issue."
  },
  {
    icon: "💡",
    title: "Improve",
    message: "How can I improve this code?"
  }
];
```

---

## 🛠️ 技术实现

### 文件结构（极简）

```
src/components/
└── QuickMessagesBar.jsx    # 唯一组件，约 100 行代码
```

### 核心代码

```jsx
// src/components/QuickMessagesBar.jsx
import React from 'react';

const QUICK_MESSAGES = [
  { icon: "📝", title: "Review Code", message: "Please review this code and suggest improvements." },
  { icon: "🐛", title: "Find Bugs", message: "Help me find potential bugs in this code." },
  { icon: "📚", title: "Explain", message: "Explain what this code does in simple terms." },
  { icon: "⚡", title: "Optimize", message: "How can I optimize this code for better performance?" },
  { icon: "🧪", title: "Add Tests", message: "Generate unit tests for this code." }
];

const QuickMessagesBar = ({ onSendMessage }) => {
  const handleClick = (message) => {
    onSendMessage(message);
  };

  return (
    <div className="quick-messages-bar flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {QUICK_MESSAGES.map((msg, index) => (
        <button
          key={index}
          onClick={() => handleClick(msg.message)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors
                     whitespace-nowrap flex-shrink-0"
          title={msg.message}
        >
          <span>{msg.icon}</span>
          <span className="hidden sm:inline">{msg.title}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickMessagesBar;
```

### 集成到 ChatInterface

```jsx
// src/components/ChatInterface.jsx
import QuickMessagesBar from './QuickMessagesBar';

// 在输入框上方添加
<QuickMessagesBar onSendMessage={handleSendMessage} />
```

---

## 📱 响应式设计

### 桌面端（>768px）
```
[📝 Review Code] [🐛 Find Bugs] [📚 Explain] [⚡ Optimize] [🧪 Add Tests]
```

### 移动端（<768px）
```
[📝] [🐛] [📚] [⚡] [🧪]  ← 只显示图标
```

---

## 📅 实施计划

### 时间估算
**总时间**: 1-2 天

### 任务清单
- [ ] 创建 `QuickMessagesBar.jsx` 组件（2 小时）
- [ ] 集成到 `ChatInterface.jsx`（1 小时）
- [ ] 响应式样式调整（1 小时）
- [ ] 测试和调试（2 小时）

### 验收标准
- ✅ 用户可以看到快速消息按钮
- ✅ 点击按钮可以发送预设消息
- ✅ 桌面和移动端显示正常
- ✅ 样式与现有界面一致

---

## 🎯 预期效果

- ⏱️ **节省时间**: 常用提示词一键发送
- 🎨 **界面简洁**: 不增加复杂度
- 📱 **响应式**: 各设备都能正常使用
- 🚀 **快速实现**: 1-2 天完成

---

## 💡 未来可选扩展

如果用户反馈良好，可以考虑：
- 允许通过配置文件自定义消息（开发者级别）
- 添加更多预设消息
- 支持快捷键（Ctrl+1-5）

但当前版本**不实现**这些功能。

---

**创建时间**: 2026-01-21  
**版本**: 简化版 v1.0  
**状态**: ✅ 需求已确认  
**预计工时**: 1-2 天
