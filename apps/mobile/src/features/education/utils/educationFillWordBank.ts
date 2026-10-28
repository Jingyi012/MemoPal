export function educationFillPromptParts(prompt: string): { before: string; after: string } {
  const blank = /_{2,}|＿{2,}|\[\s*\]|（\s*）|\(\s*\)/u.exec(prompt);
  return blank ? { before: prompt.slice(0, blank.index), after: prompt.slice(blank.index + blank[0].length) } : { before: `${prompt} `, after: '' };
}
