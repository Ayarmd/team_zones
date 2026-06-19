import { formatDeviceDisplayText } from "../../maintenance/data/faultMeta";

export default function DeviceNameCell({ device, deviceName, deviceTypeLabel, deviceId }) {
  const { name, subtitle } = formatDeviceDisplayText({
    name: device?.name,
    deviceName,
    typeLabel: device?.typeLabel,
    deviceTypeLabel,
    id: device?.id,
    deviceId,
  });

  return (
    <div>
      <p className="font-bold text-gray-800 dark:text-gray-100">{name}</p>
      {subtitle ? <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{subtitle}</p> : null}
    </div>
  );
}
