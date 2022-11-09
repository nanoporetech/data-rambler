import type { SimpleFunction, SimpleValue } from '../SimpleValue.type';
import type { Emitter } from './Emitter';
import type { Environment } from './Runtime.type';

import { functions } from './functions';

export class Runtime {
  private scope: Environment[] = [];
  private inputs: Environment = {};
  private outputs: Environment = {};
  readonly globals: Record<string, SimpleValue> = {
    ...(functions as Record<string, SimpleFunction>)
  };

  private get top(): Environment | undefined {
    return this.scope[0];
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
  declare_input (symbol: string, source: Emitter): void {
    if (symbol in this.inputs) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    this.inputs[symbol] = source;
  }
  declare_output (symbol: string, source: Emitter): void {
    if (symbol in this.outputs) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    this.outputs[symbol] = source;
  }
  declare_source (symbol: string, source: Emitter): void {
    const { top } = this;
    if (top === undefined) {
      throw new Error('SyntaxError: Cannot declare a new source outside of a module');
    }
    if (symbol in top) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    top[symbol] = source;
  }
  declare_function (symbol: string, _type: string, fn: SimpleFunction): void {
    // TODO we actually need to parse the type and store it somewhere
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
}