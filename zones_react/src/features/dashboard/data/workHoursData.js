import { formatHallWorkHours } from "../../lounge/data/managerHallStorage";

/** ساعات العمل — من 2:00 مساءً إلى 2:00 صباحاً (السبت → الخميس) */
export const WORK_HOURS_CAPTION = `السبت — الخميس · ${formatHallWorkHours("14:00", "02:00")}`;

export const workHoursData = [
  { hour: "14:00", hours: 19 },
  { hour: "15:00", hours: 22 },
  { hour: "16:00", hours: 24 },
  { hour: "17:00", hours: 28 },
  { hour: "18:00", hours: 32 },
  { hour: "19:00", hours: 35 },
  { hour: "20:00", hours: 38 },
  { hour: "21:00", hours: 36 },
  { hour: "22:00", hours: 30 },
  { hour: "23:00", hours: 24 },
  { hour: "00:00", hours: 18 },
  { hour: "01:00", hours: 12 },
  { hour: "02:00", hours: 8 },
];
