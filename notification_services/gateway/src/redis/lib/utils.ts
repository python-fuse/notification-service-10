export const ms = (n: number, unit: 's' | 'm' | 'h' | 'd'): number => {
  switch (unit) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      throw new Error('Invalid time unit');
  }
};
