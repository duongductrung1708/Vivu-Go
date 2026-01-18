import type { Itinerary } from "@/hooks/useItineraries";
import type { Trip, Day, Place } from "@/store/useTripStore";

/**
 * Convert time slot to time of day
 */
function getTimeForSlot(timeSlot: Place["timeSlot"], specificTime?: string): { hour: number; minute: number } {
  if (specificTime) {
    const [hour, minute] = specificTime.split(":").map(Number);
    return { hour, minute };
  }

  // Default times for time slots
  switch (timeSlot) {
    case "morning":
      return { hour: 9, minute: 0 };
    case "noon":
      return { hour: 12, minute: 0 };
    case "afternoon":
      return { hour: 14, minute: 0 };
    case "evening":
      return { hour: 18, minute: 0 };
    default:
      return { hour: 9, minute: 0 };
  }
}

/**
 * Format date and time to ICS format (YYYYMMDDTHHmmss)
 */
function formatICSDateTime(date: string, hour: number, minute: number): string {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hourStr = String(hour).padStart(2, "0");
  const minuteStr = String(minute).padStart(2, "0");
  return `${year}${month}${day}T${hourStr}${minuteStr}00`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate Google Calendar ICS file content
 */
export function generateGoogleCalendarICS(itinerary: Itinerary): string {
  const trip: Trip = itinerary.trip_data;
  const lines: string[] = [];

  // Calendar header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Vivu Go//Itinerary Export//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  // Process each day
  trip.days.forEach((day: Day) => {
    day.places.forEach((place: Place) => {
      const { hour, minute } = getTimeForSlot(place.timeSlot, place.specificTime);
      const startDateTime = formatICSDateTime(day.date, hour, minute);
      
      // End time is 1 hour after start (or adjust based on category)
      let endHour = hour + 1;
      let endMinute = minute;
      if (endHour >= 24) {
        endHour = 23;
        endMinute = 59;
      }
      const endDateTime = formatICSDateTime(day.date, endHour, endMinute);

      // Generate unique ID for event
      const uid = `${place.id}-${itinerary.id}@vivu-go.app`;

      // Build description
      const descriptionParts: string[] = [];
      if (place.category) {
        descriptionParts.push(`Loại: ${place.category}`);
      }
      if (place.estimatedCost > 0) {
        descriptionParts.push(`Chi phí ước tính: ${place.estimatedCost.toLocaleString("vi-VN")} đ`);
      }
      if (place.latitude && place.longitude) {
        descriptionParts.push(`Vị trí: https://maps.google.com/?q=${place.latitude},${place.longitude}`);
      }
      const description = descriptionParts.join("\\n");

      // Location (use coordinates if available)
      const location = place.latitude && place.longitude 
        ? `${place.name} (${place.latitude}, ${place.longitude})`
        : place.name;

      // Event
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTART:${startDateTime}`);
      lines.push(`DTEND:${endDateTime}`);
      lines.push(`SUMMARY:${escapeICS(place.name)}`);
      if (description) {
        lines.push(`DESCRIPTION:${escapeICS(description)}`);
      }
      lines.push(`LOCATION:${escapeICS(location)}`);
      lines.push(`DTSTAMP:${formatICSDateTime(new Date().toISOString().slice(0, 10), new Date().getHours(), new Date().getMinutes())}`);
      lines.push("END:VEVENT");
    });
  });

  // Calendar footer
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Export itinerary to Google Calendar (downloads ICS file)
 */
export function exportItineraryToGoogleCalendar(itinerary: Itinerary): void {
  try {
    const icsContent = generateGoogleCalendarICS(itinerary);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${itinerary.title.replace(/[^a-z0-9]/gi, "_")}_calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to Google Calendar:", error);
    throw new Error("Không thể xuất lịch trình sang Google Calendar");
  }
}
