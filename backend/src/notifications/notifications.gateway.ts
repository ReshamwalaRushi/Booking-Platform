import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface NotificationPayload {
  type: string;
  message: string;
  data?: unknown;
  createdAt: string;
  read: boolean;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  /** In-memory per-user notification list (keyed by userId) */
  private readonly store = new Map<string, NotificationPayload[]>();

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    // Send stored unread count on join
    const unread = (this.store.get(userId) ?? []).filter((n) => !n.read).length;
    client.emit('unread_count', unread);
  }

  @SubscribeMessage('mark_read')
  handleMarkRead(_client: Socket, userId: string) {
    const notifications = this.store.get(userId) ?? [];
    notifications.forEach((n) => (n.read = true));
    this.store.set(userId, notifications);
  }

  getUnreadCount(userId: string): number {
    return (this.store.get(userId) ?? []).filter((n) => !n.read).length;
  }

  getNotifications(userId: string): NotificationPayload[] {
    return this.store.get(userId) ?? [];
  }

  /** Broadcast a new-booking event to a specific user room */
  notifyUser(userId: string, payload: { type: string; message: string; data?: unknown }) {
    const entry: NotificationPayload = {
      ...payload,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const list = this.store.get(userId) ?? [];
    list.unshift(entry);
    this.store.set(userId, list.slice(0, 50)); // keep last 50
    this.server.to(`user:${userId}`).emit('notification', entry);
    const unread = list.filter((n) => !n.read).length;
    this.server.to(`user:${userId}`).emit('unread_count', unread);
  }

  /** Broadcast to all connected clients (e.g. admin updates) */
  broadcastToAll(payload: { type: string; message: string; data?: unknown }) {
    this.server.emit('notification', { ...payload, createdAt: new Date().toISOString(), read: false });
  }
}
