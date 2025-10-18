import { bold } from '@breadc/color';

import { getSubjectAlias } from 'bgmt';

import type { DatabaseBangumi } from '../client';

export function printBangumiSubject(bangumi: DatabaseBangumi) {
  const subject = bangumi.data;

  const label = (str: string) => {
    return bold(str.padStart(10, ' '));
  };

  console.log(`${label('id')}  ${subject.id}`);
  console.log(`${label('name')}  ${subject.name_cn || subject.name || '?'}`);
  console.log(`${label('platform')}  ${subject.platform}`);
  console.log(`${label('date')}  ${subject.date}`);
  console.log(
    `${label('rating')}  ${subject.rating.score} #${subject.rating.rank} (count. ${subject.rating.total})`
  );

  const alias = getSubjectAlias(subject);
  if (alias.length > 0) {
    console.log(`${label('alias')}  ${alias[0]}`);
    for (const a of alias.slice(1)) {
      console.log(`${label('')}  ${a}`);
    }
  }

  console.log(
    `${label('updated')}  ${new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(bangumi.updatedAt))}`
  );

  // console.log(subject);
}
