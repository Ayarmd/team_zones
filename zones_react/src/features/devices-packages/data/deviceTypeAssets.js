/** صور مصغّرة حسب نوع الجهاز */
export const DEVICE_TYPE_IMAGES = {
  ps5: "https://images.unsplash.com/photo-1606144042614-bcd7b3865a27?w=120&h=120&fit=crop",
  xbox: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=120&h=120&fit=crop",
  pc: "https://images.unsplash.com/photo-1593305841991-05c298ba4575?w=120&h=120&fit=crop",
  vr: "https://images.unsplash.com/photo-1622979135225-d2fe269b1deb?w=120&h=120&fit=crop",
};

export function getDeviceImage(device) {
  if (device?.image) return device.image;
  return DEVICE_TYPE_IMAGES[device?.type] || DEVICE_TYPE_IMAGES.pc;
}
