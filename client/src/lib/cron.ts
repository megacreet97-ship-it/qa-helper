// Standard 5-field cron (minute hour day-of-month month day-of-week), Vixie semantics.

interface FieldSpec {
  name: string;
  min: number;
  max: number;
  names?: string[]; // index = value
}

const MONTH_NAMES = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const FIELDS: FieldSpec[] = [
  { name: "минуты", min: 0, max: 59 },
  { name: "часы", min: 0, max: 23 },
  { name: "день месяца", min: 1, max: 31 },
  { name: "месяц", min: 1, max: 12, names: MONTH_NAMES },
  { name: "день недели", min: 0, max: 7, names: DOW_NAMES },
];

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export interface CronSchedule {
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>; // 0-6, Sunday = 0
  domRestricted: boolean;
  dowRestricted: boolean;
  normalized: string;
}

function parseValue(raw: string, spec: FieldSpec): number {
  const upper = raw.toUpperCase();
  if (spec.names) {
    const idx = spec.names.indexOf(upper);
    if (idx >= 0) return idx;
  }
  if (!/^\d+$/.test(raw)) throw new Error(`Поле «${spec.name}»: «${raw}» — не число`);
  const n = Number(raw);
  if (n < spec.min || n > spec.max) {
    throw new Error(`Поле «${spec.name}»: ${n} вне диапазона ${spec.min}–${spec.max}`);
  }
  return n;
}

function parseField(expr: string, spec: FieldSpec): { values: Set<number>; restricted: boolean } {
  const values = new Set<number>();
  let restricted = true;
  for (const part of expr.split(",")) {
    if (part === "") throw new Error(`Поле «${spec.name}»: пустой элемент списка`);
    const [rangePart, stepPart, extra] = part.split("/");
    if (extra !== undefined) throw new Error(`Поле «${spec.name}»: лишний «/» в «${part}»`);
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) {
        throw new Error(`Поле «${spec.name}»: шаг «${stepPart}» должен быть положительным числом`);
      }
      step = Number(stepPart);
    }

    let from: number, to: number;
    if (rangePart === "*" || rangePart === "?") {
      from = spec.min;
      to = spec.name === "день недели" ? 6 : spec.max;
      if (stepPart === undefined) restricted = false;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      from = parseValue(a, spec);
      to = parseValue(b, spec);
      if (from > to) throw new Error(`Поле «${spec.name}»: диапазон ${a}-${b} задом наперёд`);
    } else {
      from = parseValue(rangePart, spec);
      to = stepPart !== undefined ? (spec.name === "день недели" ? 6 : spec.max) : from;
    }
    for (let v = from; v <= to; v += step) values.add(spec.name === "день недели" && v === 7 ? 0 : v);
  }
  return { values, restricted };
}

export function parseCron(input: string): CronSchedule {
  let expr = input.trim().replace(/\s+/g, " ");
  if (!expr) throw new Error("Введите выражение");
  if (expr.startsWith("@")) {
    if (expr === "@reboot") throw new Error("@reboot срабатывает при старте системы — расписания у него нет");
    const macro = MACROS[expr.toLowerCase()];
    if (!macro) throw new Error(`Неизвестный макрос ${expr}. Доступны: ${Object.keys(MACROS).join(", ")}`);
    expr = macro;
  }
  const parts = expr.split(" ");
  if (parts.length === 6) {
    throw new Error("6 полей — это формат с секундами (Quartz/Spring). Стандартный cron: минута час день месяц день_недели");
  }
  if (parts.length !== 5) {
    throw new Error(`Нужно 5 полей: минута час день месяц день_недели. Сейчас полей: ${parts.length}`);
  }
  const [mi, ho, dm, mo, dw] = parts.map((p, i) => parseField(p, FIELDS[i]));
  return {
    minutes: mi.values,
    hours: ho.values,
    daysOfMonth: dm.values,
    months: mo.values,
    daysOfWeek: dw.values,
    domRestricted: dm.restricted,
    dowRestricted: dw.restricted,
    normalized: expr,
  };
}

function dayMatches(s: CronSchedule, d: Date): boolean {
  const dom = s.daysOfMonth.has(d.getDate());
  const dow = s.daysOfWeek.has(d.getDay());
  if (s.domRestricted && s.dowRestricted) return dom || dow; // classic cron: either one
  if (s.domRestricted) return dom;
  if (s.dowRestricted) return dow;
  return true;
}

/** Next run times in the browser's local time zone. */
export function nextRuns(s: CronSchedule, from: Date, count: number): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const limit = from.getTime() + 5 * 366 * 24 * 3600 * 1000;

  while (out.length < count && d.getTime() < limit) {
    if (!s.months.has(d.getMonth() + 1)) {
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(s, d)) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      continue;
    }
    if (!s.hours.has(d.getHours())) {
      d.setHours(d.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (!s.minutes.has(d.getMinutes())) {
      d.setMinutes(d.getMinutes() + 1, 0, 0);
      continue;
    }
    out.push(new Date(d.getTime()));
    d.setMinutes(d.getMinutes() + 1, 0, 0);
  }
  return out;
}

// ---------- human-readable description ----------

const MONTHS_RU = ["", "январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const DOW_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

function sorted(set: Set<number>): number[] {
  return Array.from(set).sort((a, b) => a - b);
}

/** 1,2,3,5 -> "1–3, 5" */
function compress(values: number[], label: (n: number) => string = String): string {
  const parts: string[] = [];
  for (let i = 0; i < values.length; i++) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    parts.push(j - i >= 2 ? `${label(values[i])}–${label(values[j])}` : j === i ? label(values[i]) : `${label(values[i])}, ${label(values[j])}`);
    i = j;
  }
  return parts.join(", ");
}

function stepOf(values: number[], min: number, max: number): number | null {
  if (values.length < 2 || values[0] !== min) return null;
  const step = values[1] - values[0];
  for (let i = 1; i < values.length; i++) if (values[i] - values[i - 1] !== step) return null;
  return values[values.length - 1] + step > max ? step : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function describeCron(s: CronSchedule): string {
  const mins = sorted(s.minutes);
  const hrs = sorted(s.hours);
  let time: string;

  const minStep = stepOf(mins, 0, 59);
  const hourStep = stepOf(hrs, 0, 23);
  if (mins.length === 60 && hrs.length === 24) time = "Каждую минуту";
  else if (mins.length === 60) time = `Каждую минуту в часы ${compress(hrs)}`;
  else if (minStep && hrs.length === 24) time = `Каждые ${minStep} мин`;
  else if (mins.length === 1 && hrs.length === 24) time = `Каждый час в ${pad(mins[0])} мин`;
  else if (mins.length === 1 && hourStep) time = `Каждые ${hourStep} ч в ${pad(mins[0])} мин`;
  else if (hrs.length * mins.length <= 6) time = "В " + hrs.flatMap((h) => mins.map((m) => `${pad(h)}:${pad(m)}`)).join(", ");
  else if (minStep) time = `Каждые ${minStep} мин в часы ${compress(hrs)}`;
  else time = `В минуты ${compress(mins)} часов ${compress(hrs)}`;

  const days: string[] = [];
  const dows = sorted(s.daysOfWeek);
  const dowText =
    dows.join() === "1,2,3,4,5" ? "по будням" : dows.join() === "0,6" ? "по выходным" : `по ${compress(dows, (n) => DOW_RU[n])}`;
  const domText = `${compress(sorted(s.daysOfMonth))} числа`;
  if (s.domRestricted && s.dowRestricted) days.push(`${domText} или ${dowText}`);
  else if (s.domRestricted) days.push(domText);
  else if (s.dowRestricted) days.push(dowText);

  if (s.months.size < 12) days.push(`в месяцы: ${compress(sorted(s.months), (n) => MONTHS_RU[n])}`);

  return [time, ...days].join(", ");
}

export const CRON_PRESETS: { expr: string; label: string }[] = [
  { expr: "*/5 * * * *", label: "Каждые 5 минут" },
  { expr: "0 * * * *", label: "Каждый час" },
  { expr: "0 9 * * 1-5", label: "Будни в 9:00" },
  { expr: "30 2 * * *", label: "Ночью в 2:30" },
  { expr: "0 0 1 * *", label: "1-го числа" },
  { expr: "0 10 * * MON", label: "По понедельникам" },
  { expr: "0 0 13 * 5", label: "13-е или пятница" },
];
