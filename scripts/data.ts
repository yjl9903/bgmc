import { getCalendar } from 'bgmc/data';
import { trimSeason } from 'bgmt';

const calendar = await getCalendar();
// console.log(calendar);
for (const day of calendar) {
  for (const d of day) {
    console.log(trimSeason(d));
  }
}
