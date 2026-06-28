import { apiClient, mapApiErrorMessage } from "../../../shared/api/apiClient";

export async function fetchReceptionCalendarByDate(date) {
  try {
    const { data } = await apiClient.get("/staff/reception/calendar", {
      params: { date },
    });
    return { ok: true, slots: data.slots || [] };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), slots: [] };
  }
}

export async function fetchActiveReceptionCalendar() {
  try {
    const { data } = await apiClient.get("/staff/reception/calendar/active");
    return { ok: true, slots: data.slots || [] };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error), slots: [] };
  }
}

export async function apiBookCalendarSlot(payload) {
  try {
    const { data } = await apiClient.post("/staff/reception/calendar", {
      device_id: Number(payload.deviceId),
      date: payload.date,
      hour: payload.hour,
      visitor_name: payload.visitorName,
      visitor_phone: payload.phone,
      visitor_email: payload.email || undefined,
      notes: payload.notes,
      package_id: payload.packageId ? Number(payload.packageId) : undefined,
      booking_code: payload.bookingCode,
    });
    return { ok: true, slot: data.slot, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function apiCancelCalendarBooking(bookingId) {
  try {
    const { data } = await apiClient.post(`/staff/reception/calendar/${bookingId}/cancel`);
    return { ok: true, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function apiStartCalendarSession(bookingId) {
  try {
    const { data } = await apiClient.post(`/staff/reception/calendar/${bookingId}/start`);
    return { ok: true, slot: data.slot, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function apiCheckInCalendarBooking(bookingId) {
  try {
    const { data } = await apiClient.post(`/staff/reception/calendar/${bookingId}/check-in`);
    return { ok: true, slot: data.slot, message: data.message };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function apiEndCalendarSession(bookingId) {
  try {
    const { data } = await apiClient.post(`/staff/reception/calendar/${bookingId}/end`);
    return {
      ok: true,
      message: data.message,
      loyalty: data.loyalty ?? null,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}

export async function apiMarkNoShowCalendarBooking(bookingId) {
  try {
    const { data } = await apiClient.post(`/staff/reception/calendar/${bookingId}/no-show`);
    return {
      ok: true,
      message: data.message,
      noShowCount: data.no_show_count,
      banCreated: Boolean(data.ban_created),
      ban: data.ban ?? null,
      slot: data.slot ?? null,
    };
  } catch (error) {
    return { ok: false, error: mapApiErrorMessage(error) };
  }
}
