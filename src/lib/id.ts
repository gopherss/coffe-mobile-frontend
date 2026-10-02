let counter = 0;

export function newId(): string {
  counter = (counter + 1) % 46656;
  const rand = Math.floor(Math.random() * 46656)
    .toString(36)
    .padStart(3, '0');
  return `${Date.now().toString(36)}-${counter.toString(36).padStart(3, '0')}${rand}`;
}
