import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
  type: string;
  message: string;
  data?: unknown;
  createdAt: string;
  read: boolean;
}

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

/** Plays a short beep using the Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Web Audio not supported
  }
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('notification', (item: NotificationItem) => {
      setNotifications((prev) => [item, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
      playNotificationSound();
    });

    socket.on('unread_count', (count: number) => {
      setUnreadCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const markAllRead = useCallback(() => {
    if (socketRef.current && userId) {
      socketRef.current.emit('mark_read', userId);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markAllRead };
}
