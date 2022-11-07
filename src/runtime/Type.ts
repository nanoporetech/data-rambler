import type { Type } from './Type.type';

export const STRING: Type = { type: 'string' };
export const NUMBER: Type = { type: 'number' };
export const BOOLEAN: Type =  { type: 'boolean' };
export const NULL: Type = { type: 'null' };
export const UNDEFINED: Type = { type: 'undefined' };
export const ANY: Type = { type: 'any' };
export const FUNCTION: Type = { function: ANY, parameters: [], rest: ANY };
export const UNKNOWN: Type = { type: 'unknown' };
export const ARRAY: Type = { array: ANY };
export const OBJECT: Type = { dictionary: ANY };

export const lookup: Record<string, Type> = {
  b: BOOLEAN,
  n: NUMBER,
  s: STRING,
  l: NULL,
  a: ARRAY,
  'a<n>': { array: NUMBER },
  'a<s>': { array: STRING },
  'a<x>': { array: ANY },
  o: OBJECT,
  f: FUNCTION,
  u: { union: [BOOLEAN, NUMBER, STRING, NULL] },
  j: { union: [BOOLEAN, NUMBER, STRING, NULL, OBJECT, ARRAY] },
  x: ANY,
};

export function resolve_type (str: string): Type {
  const type = lookup[str];
  if (type) {
    return type;
  }
  throw new Error(`Invalid type ${str}`);
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
