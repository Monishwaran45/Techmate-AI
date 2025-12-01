import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from './sync.service';

/**
 * WebSocket Gateway for real-time data synchronization
 * Handles connection authentication and room-based event broadcasting
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/sync',
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly syncService: SyncService,
  ) {}

  /**
   * Handle new WebSocket connections with JWT authentication
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token as string);
      const userId = payload.sub;

      // Store user ID in socket data
      client.data.userId = userId;

      // Join user-specific room for targeted broadcasts
      client.join(`user:${userId}`);

      console.log(`Client connected: ${client.id}, User: ${userId}`);
    } catch (error) {
      console.error('Connection authentication failed:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    console.log(`Client disconnected: ${client.id}, User: ${userId}`);
  }

  /**
   * Subscribe to data change events from clients
   */
  @SubscribeMessage('data:change')
  async handleDataChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: string; payload: any },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
      // Process the data change
      await this.syncService.processDataChange(userId, data);

      // Broadcast to all user's connected devices (except sender)
      client.to(`user:${userId}`).emit('data:updated', {
        type: data.type,
        payload: data.payload,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing data change:', error);
      return { error: 'Failed to process data change' };
    }
  }

  /**
   * Broadcast data update to all user's devices
   */
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast data update to specific client
   */
  broadcastToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
