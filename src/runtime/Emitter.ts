import type { SimpleObject, SimpleValue } from '../SimpleValue.type';
import type { Input, Listener, Output, VoidFunction } from './Emitter.type';

export class Emitter implements Input, Output {
  private subscribers: Set<Listener> = new Set();
  private error_subscribers: Set<Listener<Error>> = new Set();
  private value: SimpleValue = undefined;

  constructor (readonly generation: number) {}

  watch (fn: Listener, on_error?: Listener<Error>): () => void {
    this.subscribers.add(fn);
    fn(this.value);

    if (on_error) {
      this.error_subscribers.add(on_error);
    }

    return () => {
      this.subscribers.delete(fn);
      if (on_error) {
        this.error_subscribers.delete(on_error);
      }
    };
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

  emit_error (err: Error): void {
    for (const fn of this.error_subscribers) {
      fn(err);
    }
  }

  get_value (): SimpleValue {
    return this.value;
  }

  static Resolve<T> (source: Output<T | Promise<T>>): Output<T | undefined> {
    const watch = (on_next: Listener<T | undefined>, on_error?: Listener<Error>) => {
      let iteration = 0;
      const handoff = async (value: T | Promise<T>) => {
        const current = iteration;
        let result: T | undefined;
        
        try {
          result = await value;
        } catch (error) {
          on_error?.(error instanceof Error ? error : new Error('Unexpected runtime error'));
        }
        if (iteration > current) {
          return;
        }
        iteration += 1;
        on_next(result);
      };

      return source.watch(
        value => void handoff(value),
        err => void handoff(Promise.reject(err)),
      );
    };

    return {
      watch
    };
  }

  static Combine (sources: Record<string, Output>): Output<SimpleObject> {
    const listeners = new Set<Listener<SimpleObject>>();
    const error_listeners = new Set<Listener<Error>>();
    const combined_value: Record<string, SimpleValue> = {};
    let disposer: VoidFunction | null = null;
    let queued = false;
  
    const update_value = (name: string, value: SimpleValue) => {
      if (combined_value[name] === value) {
        return;
      }
      // maybe this is bad? unsure if keeping identify causes issues
      combined_value[name] = value;
      if (queued) {
        return;
      }
      queued = true;
      queueMicrotask(notify_observers);
    };

    const notify_observers = () => {
      queued = false;
      for (const fn of listeners) {
        try {
          fn(combined_value);
        } catch {
          // NOTE discard errors, we can't do much with them
        }
      }
    };

    const signal_error = (err: Error) => {
      for (const fn of error_listeners) {
        try {
          fn(err);
        } catch {
          // NOTE discard errors, we can't do much with them
        }
      }
    };

    const subscribe = () => {
      const disposers = Object.entries(sources).map(([name, src]) => 
        Emitter.Resolve(src).watch(
          value => {
            update_value(name, value);
          }, (err) => {
            update_value(name, undefined);
            signal_error(err);
          }
        ));
  
      return () => disposers.forEach(fn => fn());
    };
  
    const watch = (listener: Listener<SimpleObject>, on_error?: Listener<Error>): VoidFunction => {
      if (!disposer) { 
        disposer = subscribe();
      }
      try {
        listener(combined_value);
      } catch {
        // NOTE discard errors, we can't do much with them
      }
      listeners.add(listener);
      if (on_error) {
        // NOTE passes individual errors during composition instead if
        // collected errors
        error_listeners.add(on_error);
      }
      return () => {
        listeners.delete(listener);
        if (on_error) {
          error_listeners.delete(on_error);
        }
        if (disposer && listeners.size === 0) {
          disposer();
          disposer = null;
        }
      };
    };
  
    return { watch };
  }
}