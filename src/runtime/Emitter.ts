import type { SimpleObject, SimpleValue } from '../SimpleValue.type';
import type { Input, Listener, Output, VoidFunction } from './Emitter.type';

export class Emitter implements Input, Output {
  private subscribers: Set<Listener> = new Set();
  private value: SimpleValue = undefined;

  watch (fn: Listener): () => void {
    this.subscribers.add(fn);
    fn(this.value);
    return () => this.subscribers.delete(fn);
  }

  emit (value: SimpleValue): void {
    if (this.value === value) {
      return;
    }
    
    this.value = value;
    for (const fn of this.subscribers) {
      fn(value);
    }
  }

  static Combine (sources: Record<string, Output>): Output<SimpleObject> {
    const listeners = new Set<Listener<SimpleObject>>();
    const combined_value: Record<string, SimpleValue> = {};
    let disposer: VoidFunction | null = null;
  
    const subscribe = () => {
      const disposers = Object.entries(sources).map(([name, src]) => src.watch(value => {
        // TODO we could resolve promises here
        if (combined_value[name] === value) {
          return;
        }
        combined_value[name] = value;
        for (const fn of listeners) {
          try {
            fn(combined_value);
          } catch {
            // NOTE discard errors, we can't do much with them
          }
        }
      }));
  
      return () => disposers.forEach(fn => fn());
    };
  
    const watch = (listener: Listener<SimpleObject>): VoidFunction => {
      if (!disposer) { 
        disposer = subscribe();
      }
      try {
        listener(combined_value);
      } catch {
        // NOTE discard errors, we can't do much with them
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (disposer && listeners.size === 0) {
          disposer();
          disposer = null;
        }
      };
    };
  
    return { watch };
  }
}