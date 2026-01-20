import React from 'react';

export default function Toast({ toast, onClose }) {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return '✓';
            case 'error': return '✗';
            case 'warning': return '⚠';
            default: return 'ℹ';
        }
    };

    return (
        <div className={`toast ${toast.type}`}>
            <div className="toast-icon">{getIcon()}</div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && (
                    <div className="toast-message">{toast.message}</div>
                )}
            </div>
            <button
                className="toast-close"
                onClick={() => onClose(toast.id)}
                aria-label="Close"
            >
                ×
            </button>
        </div>
    );
}
