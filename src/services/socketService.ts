
import { io, Socket } from 'socket.io-client';

/**
 * LiveSocket handles real-time bidirectional communication with the backend.
 */
class LiveSocket {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  constructor() {
    // In production, the URL is inferred or provided via env
    this.connect();
  }

  private connect() {
    try {
      // @ts-ignore
      this.socket = io({
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.debug('Connected to Dronehub Realtime Server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.debug('Disconnected from Dronehub Realtime Server');
      });
    } catch (err) {
      console.error('Socket initialization failed:', err);
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  public emit(event: string, data: any) {
    if (this.isConnected) {
      this.socket?.emit(event, data);
    }
  }

  public close() {
    this.socket?.close();
  }
}

export const socketService = new LiveSocket();
