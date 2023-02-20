import type { SimpleFunction, SimpleValue } from '../SimpleValue.type';
import { Emitter } from './Emitter';
import type { Environment } from './Runtime.type';

import { functions } from './functions';
import { parse_function_type } from './Type';
import type { TypedFunction } from './functions.type';
import type { Output, VoidFunction } from './Emitter.type';

export class Runtime {
  private scope: Environment[] = [];
  private inputs: Environment = {};
  private outputs: Environment = {};
  private subscriptions: VoidFunction[] = [];
  generation = 0;

  readonly globals: Record<string, SimpleValue> = {
    ...(functions as Record<string, SimpleFunction>)
  };

  private get top(): Environment | undefined {
    return this.scope[0];
  }

  dispose () {
    for (const cleanup of this.subscriptions) {
      cleanup();
    }
    this.subscriptions.length = 0;
  }
  start_generation () {
    this.generation += 1;
    this.dispose();
  }
  /**
   * @package
   * Used internally for module level scopes
   */
  push_scope (): void {
    this.scope.unshift({});
  }
  /**
   * @package
   * Used internally for module level scopes
   */
  pop_scope (): void {
    this.scope.shift();
  }
  declare_input (symbol: string, update = false): void {
    const existing = this.inputs[symbol];
    if (existing) {
      if (update && existing.generation < this.generation) {
        return;
      }
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    this.inputs[symbol] = new Emitter(this.generation);
  }
  declare_output (symbol: string, update = false): void {
    const existing = this.outputs[symbol];

    if (existing) {
      if (update && existing.generation < this.generation) {
        return;
      }
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    this.outputs[symbol] = new Emitter(this.generation);
  }
  declare_source (symbol: string): void {
    const { top } = this;
    if (top === undefined) {
      throw new Error('SyntaxError: Cannot declare a new source outside of a module');
    }
    if (symbol in top) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    // NOTE scopes are always unique per evaluation, so it's not possible to locate a source stream
    top[symbol] = new Emitter(0);
  }
  declare_function (symbol: string, type: string, fn: SimpleFunction): void {
    (fn as TypedFunction).SIGNATURE = parse_function_type(type);
    this.declare_global(symbol, fn);
  }
  declare_global (symbol: string, value: SimpleValue): void {
    if (symbol in this.globals) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    this.globals[symbol] = value;
  }
  resolve_source (symbol: string): Emitter | null {
    for (const scope of this.scope) {
      const stream = scope[symbol];
      if (stream) { 
        return stream;
      }
    }
    return this.inputs[symbol] ?? this.outputs[symbol] ?? null;
  }
  resolve_input (symbol: string): Emitter | null {
    return this.inputs[symbol] ?? null;
  }
  bind_stream (stream: Output, target: Emitter) {
    const sub = stream.watch(value => target.emit(value));
    this.subscriptions.push(sub);
  }
}