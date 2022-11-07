export class Range {
  readonly min: number;
  readonly max: number;

  constructor(min: number, max: number) {
    min = Math.floor(min);
    max = Math.floor(max);
    if (max < min) {
      this.min = min;
      this.max = min;
    } else {
      this.min = min;
      this.max = max;
    }
  }

  includes(i: number): boolean {
    return i >= this.min && i <= this.max;
  }

  expand(): number[] {
    const result: number[] = [];
    if (this.min === this.max) {
      return result;
    }
    for (let i = this.min; i <= this.max; i += 1) {
      result.push(i);
    }
    return result;
  }
}