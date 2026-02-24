import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use localhost for all platforms with ADB reverse port forwarding
const SOCKET_URL = 'http://localhost:5000';

export interface IncomingCall {
  callerId: number;
  callerName: string;
  callerPhoto?: string;
  groupId: number;
  groupName: string;
  callType: 'video' | 'audio';
  roomId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;
  private isConnecting: boolean = false;
  
  // Callbacks for call notifications
  public onIncomingCall?: (call: IncomingCall) => void;
  public onCallAccepted?: (data: { acceptorId: number; acceptorName: string; roomId: string }) => void;
  public onCallRejected?: (data: { rejectorId: number; roomId: string }) => void;
  public onCallEnded?: (data: { roomId: string }) => void;
  public onConnectionChange?: (connected: boolean) => void;

//   isConnected(): boolean {
//     return this.socket?.connected || false;
//   }

  async connect(userId: number) {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[SocketService] Connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('[SocketService] No token found');
        return;
      }

      this.userId = userId;

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        auth: {
          token,
          userId,
        },
      });

      this.socket.on('connect', () => {
        console.log('[SocketService] Connected to server');
        this.isConnecting = false;
        if (this.onConnectionChange) {
          this.onConnectionChange(true);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('[SocketService] Connection error:', error.message);
        this.isConnecting = false;
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
        
        // Auto-reconnect if not intentional disconnect
        if (reason !== 'io client disconnect') {
          console.log('[SocketService] Attempting to reconnect...');
        }
      });

      // Call notification listeners
      this.socket.on('call:incoming', (call: IncomingCall) => {
        console.log('[SocketService] Incoming call:', call);
        if (this.onIncomingCall) {
          this.onIncomingCall(call);
        }
      });

      this.socket.on('call:accepted', (data) => {
        console.log('[SocketService] Call accepted:', data);
        if (this.onCallAccepted) {
          this.onCallAccepted(data);
        }
      });

      this.socket.on('call:rejected', (data) => {
        console.log('[SocketService] Call rejected:', data);
        if (this.onCallRejected) {
          this.onCallRejected(data);
        }
      });

      this.socket.on('call:ended', (data) => {
        console.log('[SocketService] Call ended:', data);
        if (this.onCallEnded) {
          this.onCallEnded(data);
        }
      });

    } catch (error) {
      console.error('[SocketService] Failed to connect:', error);
      this.isConnecting = false;
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Disconnected');
    }
  }

  initiateCall(params: {
    callerId: number;
    callerName: string;
    callerPhoto?: string;
    recipientIds: number[];
    groupId: number;
    groupName: string;
    callType: 'video' | 'audio';
    roomId: string;
  }): boolean {
    if (!this.socket?.connected) {
      console.error('[SocketService] Not connected, cannot initiate call');
      return false;
    }

    console.log('[SocketService] Initiating call:', params);
    this.socket.emit('call:invite', params);
    return true;
  }

  acceptCall(params: {
    callerId: number;
    acceptorId: number;
    acceptorName: string;
    roomId: string;
  }) {
    if (!this.socket?.connected) {
      console.error('[SocketService] Not connected');
      return;
    }

    console.log('[SocketService] Accepting call:', params);
    this.socket.emit('call:accept', params);
  }

  rejectCall(params: {
    callerId: number;
    rejectorId: number;
    roomId: string;
  }) {
    if (!this.socket?.connected) {
      console.error('[SocketService] Not connected');
      return;
    }

    console.log('[SocketService] Rejecting call:', params);
    this.socket.emit('call:reject', params);
  }

  endCall(params: {
    roomId: string;
    userId: number;
    recipientIds: number[];
  }) {
    if (!this.socket?.connected) {
      console.error('[SocketService] Not connected');
      return;
    }

    console.log('[SocketService] Ending call:', params);
    this.socket.emit('call:end', params);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getUserId(): number | null {
    return this.userId;
  }
}

export const socketService = new SocketService();
export default socketService;
