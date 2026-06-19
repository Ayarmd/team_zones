import { Gamepad2, Glasses, Monitor } from "lucide-react";
import { DEVICE_TYPE_LABEL } from "./deviceNaming";
import { collectDeviceTypeEntries } from "./customDeviceTypesStorage";

const ICONS = {
  ps5: <Gamepad2 size={16} strokeWidth={2} />,
  xbox: <Gamepad2 size={16} strokeWidth={2} />,
  vr: <Glasses size={16} strokeWidth={2} />,
  pc: <Monitor size={16} strokeWidth={2} />,
  custom: <Gamepad2 size={16} strokeWidth={2} />,
};

export const DEVICE_TYPE_SELECT_OPTIONS = [
  { value: "ps5", label: DEVICE_TYPE_LABEL.ps5, icon: ICONS.ps5 },
  { value: "xbox", label: DEVICE_TYPE_LABEL.xbox, icon: ICONS.xbox },
  { value: "vr", label: DEVICE_TYPE_LABEL.vr, icon: ICONS.vr },
  { value: "pc", label: DEVICE_TYPE_LABEL.pc, icon: ICONS.pc },
];

/** الأنواع الافتراضية + المحفوظة + المستخدمة في الأجهزة */
export function buildDeviceTypeOptions(devices = []) {
  const map = new Map();

  DEVICE_TYPE_SELECT_OPTIONS.forEach((option) => {
    map.set(option.label.toLowerCase(), option);
  });

  collectDeviceTypeEntries(devices).forEach((row) => {
    const key = row.typeLabel.toLowerCase();
    if (map.has(key)) return;
    map.set(key, {
      value: row.type,
      label: row.typeLabel,
      icon: ICONS.custom,
      custom: true,
    });
  });

  return Array.from(map.values());
}
