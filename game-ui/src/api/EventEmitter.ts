export type Listener = (...args: any[]) => void;

export class EventEmitter {
  private _events: Record<string, Listener[] | Listener | undefined> = {};
  private _maxListeners: number = 10;

  setMaxListeners(n: number): void {
    this._maxListeners = n;
  }

  on(event: string, listener: Listener): () => void {
    if (typeof listener !== 'function') throw new Error('Listener must be a function');

    this.emit('newListener', event, listener);

    if (!this._events[event]) {
      this._events[event] = listener;
    } else if (Array.isArray(this._events[event])) {
      (this._events[event] as Listener[]).push(listener);
    } else {
      this._events[event] = [this._events[event] as Listener, listener];
    }

    if (
      Array.isArray(this._events[event]) &&
      this._events[event]!.length > this._maxListeners
    ) {
      console.warn(`Possible memory leak: more than ${this._maxListeners} listeners`);
    }
    console.log('create', event, this._events)
    return () => {
      console.log('remove', event)
      this.removeListener(event, listener);
    };
  }

  once(event: string, listener: Listener): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const handlers = this._events[event];
    if (!handlers) return false;

    if (typeof handlers === 'function') {
      handlers(...args);
    } else if (Array.isArray(handlers)) {
      handlers.forEach(h => h(...args));
    }

    return true;
  }

  removeListener(event: string, listener: Listener): this {
    const handlers = this._events[event];
    if (!handlers) return this;

    if (typeof handlers === 'function') {
      if (handlers === listener) delete this._events[event];
    } else if (Array.isArray(handlers)) {
      this._events[event] = handlers.filter(h => h !== listener);
    }

    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }

  listeners(event: string): Listener[] {
    const handlers = this._events[event];
    return typeof handlers === 'function' ? [handlers] : handlers || [];
  }
}
