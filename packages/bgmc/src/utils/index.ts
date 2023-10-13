import type { SubjectInformation } from '../client';

export function getSubjectAlias(subject: SubjectInformation) {
  const aliasBox = subject.infobox?.find((box) => box.key === '别名');
  const translations = Array.isArray(aliasBox?.value)
    ? (aliasBox?.value.map((v) => v?.v).filter(Boolean) as string[]) ?? []
    : typeof aliasBox?.value === 'string'
    ? [aliasBox.value]
    : [];
  return [...new Set([subject.name, ...translations])];
}
