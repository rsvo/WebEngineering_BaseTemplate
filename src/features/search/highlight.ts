export interface TextPart {
  text: string;
  isMatch: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitByQuery(text: string, query: string): TextPart[] {
  if (query === '') return [{ text, isMatch: false }];

  // With a capture group, split() keeps the matches at the odd indexes.
  return text
    .split(new RegExp(`(${escapeRegExp(query)})`, 'i'))
    .map((part, index) => ({ text: part, isMatch: index % 2 === 1 }))
    .filter((part) => part.text !== '');
}
