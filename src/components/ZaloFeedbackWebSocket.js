import React, { useEffect, useRef } from 'react';

/**
 * ZaloFeedbackWebSocket
 * Props:
 *   - email: string (email user hoặc admin)
 *   - onFeedbackNew: function(feedback) (callback khi có feedback mới cho admin)
 *   - onFeedbackStatus: function(status, feedback) (callback khi feedback user đổi trạng thái)
 */
export default function ZaloFeedbackWebSocket({ email, onFeedbackNew, onFeedbackStatus }) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!email) return;
    const ws = new window.WebSocket('ws://localhost:1337/ws?email=' + encodeURIComponent(email));
    wsRef.current = ws;

    ws.onopen = () => {
      // Kết nối thành công
      // console.log('WebSocket connected as:', email);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'feedback_new' && typeof onFeedbackNew === 'function') {
          onFeedbackNew(data.feedback);
        }
        if (data.type === 'feedback_status' && typeof onFeedbackStatus === 'function') {
          onFeedbackStatus(data.status, data.feedback);
        }
      } catch (err) {
        // console.error('Lỗi parse message:', event.data);
      }
    };

    ws.onclose = () => {
      // console.log('WebSocket disconnected');
    };
    ws.onerror = (e) => {
      // console.error('WebSocket error:', e.message);
    };

    return () => {
      ws.close();
    };
  }, [email, onFeedbackNew, onFeedbackStatus]);

  return null; // Component này không render gì ra UI
} 