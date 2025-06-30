import { EventEmitter } from './EventEmitter';
import { Protocol } from './Protocol';
import io from 'socket.io-client';

export class PomeloClient extends EventEmitter {
  public socket: any | null = null;
  private id = 1;
  private callbacks: Record<number, (data: any) => void> = {};
  private areaId?: string;

  init(params: { host: string; port?: number }, cb?: (s: any) => void): void {
    const url = `ws://${params.host}${params.port ? ':' + params.port : ''}`;
    this.socket = io(url, { 'force new connection': true, reconnection: false, log: true });
    this.socket.on('connect', () => {
      cb?.(this.socket!);
    });

    this.socket.on('message', (data: string | any) => {
      if (typeof data === 'string') {
        this.processMessage(JSON.parse(data));
      } else if (Array.isArray(data)) {
        data.forEach((msg: any) => this.processMessage(msg));
      }
    });

    this.socket.on('disconnect', reason => {
      this.emit('disconnect', reason);
    });

    this.socket.on('error', err => {
      console.error('[PomeloClient] Error:', err);
    });
  }

  request(route: string, msg: any = {}, cb?: (data: any) => void): void {
    if (!this.socket) return;

    this.id++;
    if (cb) this.callbacks[this.id] = cb;
    msg = this.filter(msg, route);

    const encoded = Protocol.encode(this.id, route, msg);
    this.socket.send(encoded);
  }

  notify(route: string, msg: any = {}): void {
    this.request(route, msg);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private processMessage(msg: { id: number; route: string; body: string }): void {
    if (msg.id) {
      const cb = this.callbacks[msg.id];
      delete this.callbacks[msg.id];
      if (cb) cb(msg.body);
    } else {
      this.emit(msg.route, msg.body);
    }
  }

  private filter(msg: any, route: string): any {
    if (route.startsWith('area.') && this.areaId) {
      msg.areaId = this.areaId;
    }
    msg.timestamp = Date.now();
    return msg;
  }
}
