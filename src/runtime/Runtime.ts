import type { SimpleFunction, SimpleValue } from "../SimpleValue.type";
import type { Emitter } from "./Emitter";
import type { Environment } from "./Runtime.type";

import { functions } from './functions';

export class Runtime {
  private scope: Environment[] = [];
  private inputs: Environment = {};
  private outputs: Environment = {};
  readonly globals: Record<string, SimpleValue> = {
    ...(functions as Record<string, SimpleFunction>)
  };

  private get top(): Environment {
    return this.scope[0];
  }
  push_scope (): void {
    this.scope.unshift({});
  }
  pop_scope (): void {
    this.scope.shift();
  }
  declare_input (symbol: string, source: Emitter): void {
    if (symbol in this.inputs.symbol) {
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
    if (symbol in top) {
      throw new Error(`SyntaxError: Identifier '${symbol}' has already been declared`);
    }
    top[symbol] = source;
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
}