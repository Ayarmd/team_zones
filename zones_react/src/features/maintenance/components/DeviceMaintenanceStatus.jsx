import FaultToggleSwitch from "./FaultToggleSwitch";

export default function DeviceMaintenanceStatus({ hasFault, onChange, deviceName }) {
  return (
    <div className="maint-device-status-inline">
      <span
        className={`maint-device-status-inline__label ${
          hasFault ? "maint-device-status-inline__label--fault" : "maint-device-status-inline__label--ok"
        }`}
      >
        {hasFault ? "صيانة" : "سليم"}
      </span>
      <FaultToggleSwitch
        checked={hasFault}
        onChange={onChange}
        label={hasFault ? `جهاز ${deviceName} في صيانة` : `جهاز ${deviceName} سليم`}
      />
    </div>
  );
}
