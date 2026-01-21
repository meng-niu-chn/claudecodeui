import React from 'react';

const QUICK_MESSAGES = [
    {
        icon: "📝",
        title: "生成视图SQL",
        message: "@任务/view-sql-generator.md"
    }
];

const QuickMessagesBar = ({ onSendMessage }) => {
    const handleClick = (message) => {
        if (onSendMessage) {
            onSendMessage(message);
        }
    };

    return (
        <div className="quick-messages-bar flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {QUICK_MESSAGES.map((msg, index) => (
                <button
                    key={index}
                    onClick={() => handleClick(msg.message)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors
                     whitespace-nowrap flex-shrink-0 border border-transparent
                     hover:border-gray-300 dark:hover:border-gray-600"
                    title={msg.message}
                >
                    <span className="text-base">{msg.icon}</span>
                    <span className="hidden sm:inline font-medium">{msg.title}</span>
                </button>
            ))}
        </div>
    );
};

export default QuickMessagesBar;
