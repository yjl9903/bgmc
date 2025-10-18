import { bold } from '@breadc/color';

import { getSubjectAlias } from 'bgmt';

import type { CalendarSubject, DatabaseBangumi, DatabaseSubject } from '../client';

import { formatDatetime } from '../utils';

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

  console.log(`${label('updated')}  ${formatDatetime(new Date(bangumi.updatedAt))}`);

  // console.log(subject);
}

export function printSubject(data: DatabaseSubject) {
  const subject = data.data;

  const label = (str: string) => {
    return bold(str.padStart(10, ' '));
  };

  console.log(`${label('id')}  ${subject.id}`);
  console.log(`${label('name')}  ${subject.title}`);
  console.log(`${label('platform')}  ${subject.platform}`);
  console.log(`${label('date')}  ${subject.onair_date}`);
  console.log(`${label('rating')}  ${subject.rating.score} #${subject.rating.rank}`);

  const include = data.search.include;
  if (include.length > 0) {
    console.log(`${label('include')}  ${include[0]}`);
    for (const a of include.slice(1)) {
      console.log(`${label('')}  ${a}`);
    }
  }
  const exclude = data.search.exclude;
  if (exclude && exclude.length > 0) {
    console.log(`${label('exclude')}  ${exclude[0]}`);
    for (const a of exclude.slice(1)) {
      console.log(`${label('')}  ${a}`);
    }
  }

  console.log(`${label('updated')}  ${formatDatetime(new Date(data.updatedAt))}`);

  // console.log(subject);
}

export function printCalendar(calendar: CalendarSubject[][], web: CalendarSubject[]) {
  for (let i = 0; i < calendar.length; i++) {
    console.log(bold(['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]));
    for (const item of calendar[i]) {
      console.log(`${item.title}`);
    }
    console.log();
  }

  console.log();
  console.log(`${bold('web')}`);
  for (const item of web) {
    console.log(`${item.title}`);
  }
}
