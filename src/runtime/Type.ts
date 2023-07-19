import { Range } from '../Range';
import type { SimpleValue } from '../SimpleValue.type';
import type { FunctionType, Type } from './Type.type';

export const STRING: Type = { type: 'string' };
export const NUMBER: Type = { type: 'number' };
export const BOOLEAN: Type =  { type: 'boolean' };
export const NULL: Type = { type: 'null' };
export const UNDEFINED: Type = { type: 'undefined' };
export const ANY: Type = { type: 'any' };
export const FUNCTION: FunctionType = { function: ANY, parameters: [], rest: ANY };
export const UNKNOWN: Type = { type: 'unknown' };
export const ARRAY: Type = { array: ANY };
export const OBJECT: Type = { dictionary: ANY };
export const PRIMITIVE: Type = { union: [BOOLEAN, NUMBER, STRING, NULL] };
export const JSON: Type = { union: [BOOLEAN, NUMBER, STRING, NULL, OBJECT, ARRAY] };

export function parse_function_type(str: string): FunctionType {
  const ctx = {
    buffer: Array.from(str),
    i: 0,
  };

  const parameters: Type[] = [];
  let result: Type = ANY;
  let rest: Type | undefined = undefined;
  let includes_optional = false;

  while (ctx.i < ctx.buffer.length) {
    if (ctx.buffer[ctx.i] === ':') {
      ctx.i += 1;
      break;
    }
    let next = parse_type_component(ctx);
    if (ctx.buffer[ctx.i] === '+') {
      ctx.i += 1;
      rest = next;

      if (!can_assign_to(next, ARRAY)) {
        
        throw new Error('A rest parameter must be of an array type.');
      }

      if (ctx.buffer[ctx.i] === ':' || ctx.i === ctx.buffer.length) {
        continue;
      }

      throw new Error('A rest parameter must be last in a parameter list.');
    } else if (ctx.buffer[ctx.i] === '?') {
      ctx.i += 1;
      includes_optional = true;

      if ('union' in next) {
        const union = new Set(next.union);
        union.add(UNDEFINED);
        next = { union: Array.from(union) };
      } else {
        next = { union: [ next, UNDEFINED ]};
      }

      parameters.push(next);
    } else {
      if (includes_optional) {
        throw new Error('A required parameter cannot follow an optional parameter.');
      }
      parameters.push(next);
    }
  }

  if (ctx.i < ctx.buffer.length) {
    result = parse_type_component(ctx);
  }

  if (ctx.i < ctx.buffer.length) {
    throw new Error(`Unexpected token ${ctx.buffer[ctx.i] ?? ''}.`);
  }

  return {
    function: result,
    parameters,
    rest,
  };
}

export function parse_type_component(ctx: { buffer: string[]; i: number }): Type {
  const first = ctx.buffer[ctx.i];
  ctx.i += 1;
  if (!first) {
    throw new Error('Unexpected end of input.');
  }
  switch (first) {
    case 'a':
      if (ctx.buffer[ctx.i] === '<') {
        ctx.i += 1;
        return { array: parse_nested_type(ctx) };
      }
      return ARRAY;
    case 'o':
      if (ctx.buffer[ctx.i] === '<') {
        ctx.i += 1;
        return { dictionary: parse_nested_type(ctx) };
      }
      return OBJECT;
    case 'b': return BOOLEAN;
    case 'n': return NUMBER;
    case 's': return STRING;
    case 'l': return NULL;
    case 'f': return FUNCTION;
    case 'u': return PRIMITIVE;
    case 'j': return JSON;
    case 'x': return ANY;
    case '(': {
      const union = new Set<Type>();
      while (ctx.i < ctx.buffer.length) {
        if (ctx.buffer[ctx.i] === ')') {
          break;
        }
        const sub_type = parse_type_component(ctx);
        if ('union' in sub_type) {
          for (const el of sub_type.union) {
            union.add(el);
          }
        } else {
          union.add(sub_type);
        }
      }
      if (ctx.buffer[ctx.i] !== ')') {
        throw new Error(`Unexpected token ${ctx.buffer[ctx.i] ?? ''}.`);
      }
      ctx.i += 1;
      return { union: Array.from(union) };
    }
  }

  throw new Error(`Unexpected token ${first}.`);
}

export function parse_nested_type(ctx: { buffer: string[]; i: number }): Type {
  const type = parse_type_component(ctx);
  if (ctx.buffer[ctx.i] !== '>') {
    throw new Error(`Unexpected character ${ctx.buffer[ctx.i] ?? ''}`);
  }
  ctx.i += 1;
  return type;
}

export function value_typeof (value: unknown, deep = false): Type {
  switch (typeof value) {
    case 'number': return NUMBER;
    case 'boolean': return BOOLEAN;
    case 'string': return STRING;
    case 'undefined': return UNDEFINED;
    case 'function': return FUNCTION;
    case 'object': {
      if (value === null) {
        return NULL;
      }
      if (!deep) {
        return Array.isArray(value) ? ARRAY : OBJECT;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return ARRAY;
        }
        const sub_types: Set<Type> = new Set();
        for (const el of value) {
          const sub_type = value_typeof(el);
          sub_types.add(sub_type);
        }
        const union = Array.from(sub_types);
        return { array: union.length === 1 ? union[0]! : { union } };
      }
      const values = Object.values(value);
      if (values.length === 0) {
        return OBJECT;
      }
      const sub_types: Set<Type> = new Set();
      for (const el of values) {
        const sub_type = value_typeof(el);
        sub_types.add(sub_type);
      }
      const union = Array.from(sub_types);
      return { dictionary: union.length === 1 ? union[0]! : { union } };
    }
  }
  throw new Error(`Unsupported type ${typeof value}`);
}

export function stringify_type (value: Type): string {
  switch (value) {
    case STRING: return 's';
    case NUMBER: return 'n';
    case BOOLEAN: return 'b';
    case NULL: return 'l';
    case ANY: return 'x';
    case FUNCTION: return 'f';
    case ARRAY: return 'a';
    case OBJECT: return 'o';
    case PRIMITIVE: return 'u';
    case JSON: return 'j';
  }

  if ('union' in value) {
    const i = value.union.indexOf(UNDEFINED);
    const optional = i >= 0;
    const types = value.union.slice();
    if (optional) {
      types.splice(i, 1);
    }
    if (types.length === 1) {
      const first = types[0]!;
      return stringify_type(first) + (optional ? '?' : '');
    }

    return `(${value.union.map(type => stringify_type(type)).join('')})${optional ? '?' : ''}`;
  }

  if ('dictionary' in value) {
    return `o<${stringify_type(value.dictionary)}>`;
  }

  if ('array' in value) {
    return `a<${stringify_type(value.array)}>`;
  }

  if ('function' in value) {
    return 'f';
  }
  
  return 'x'; // ANY
}

/**
 * Checks if a Value can be assigned to a Type
 * Optimised to avoid needing to compute a complex Type for a Value
 * Can still be potentially slow for large typed arrays
 */
export function can_assign_value_to (value: SimpleValue, target: Type): boolean {
  if (target === ANY || target === UNKNOWN) {
    return true;
  }

  if ('union' in target) {
    return target.union.some(subtype => can_assign_value_to(value, subtype));
  }

  if ('array' in target) {
    if (!Array.isArray(value)) {
      return false;
    }
    if (target.array === ANY) {
      return true;
    }
    return value.every(value => can_assign_value_to(value, target.array));
  }

  if ('dictionary' in target) {
    if (typeof value !== 'object' || Array.isArray(value) || value === null || value instanceof Range) {
      return false;
    }
    if (target.dictionary === ANY) {
      return true;
    }
    return Object.values(value).every(value => can_assign_value_to(value, target.dictionary));
  }

  if ('function' in target) {
    return typeof value === 'function';
  }

  // _should_ only be simple Types remaining
  return value_typeof(value) === target;
}

export function can_assign_to (value: Type, target: Type): boolean {
  if (target === ANY || target === UNKNOWN || value === ANY || value === target) {
    return true;
  }

  if ('union' in target) {
    return target.union.some(subtype => can_assign_to(value, subtype));
  }

  if ('array' in value && 'array' in target) {
    return can_assign_to(value.array, target.array);
  }

  if ('dictionary' in value && 'dictionary' in target) {
    return can_assign_to(value.dictionary, target.dictionary);
  }

  if ('function' in value && 'function' in target) {
    if (!can_assign_to(value.function, target.function)) {
      return false;
    }
        
    // TODO params/variadic
    return true;
  }

  return false;
}
