export interface FunctionType {
  function: Type;
  parameters: Type[];
  rest: Type | undefined;
}

export interface SimpleType {
  type: string;
}

export interface UnionType {
  union: Type[];
}

export interface ArrayType {
  array: Type;
}

export interface DictType {
  dictionary: Type;
}

export type Type = SimpleType | UnionType | ArrayType | DictType | FunctionType;