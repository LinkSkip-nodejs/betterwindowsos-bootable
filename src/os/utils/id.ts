let seed = 0;

export const createId = (prefix: string) => {
  seed += 1;
  return `${prefix}-${seed}-${Math.random().toString(36).slice(2, 7)}`;
};
