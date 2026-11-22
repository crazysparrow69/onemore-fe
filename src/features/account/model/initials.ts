export function initials(user: {
  name: string | null;
  nickname: string | null;
  email: string;
}): string {
  const words = (user.name ?? '')
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => firstLetter(word))
      .join('');
  }
  const fallback = user.nickname ?? user.email;
  return firstLetter(fallback);
}

function firstLetter(value: string): string {
  const [first] = Array.from(value.trim());
  return first === undefined ? '?' : first.toLocaleUpperCase();
}
