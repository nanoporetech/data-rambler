export interface Position {
  column: number;
  row: number;
}

export interface Fragment {
  start: number;
  end: number;
  source: string[];
}