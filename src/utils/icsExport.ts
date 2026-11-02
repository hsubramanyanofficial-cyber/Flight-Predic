/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TripItinerary, TripLeg } from '../types';
import { calculateAirDistanceKm } from '../data/airports';
import { formatCurrency, SupportedCurrency } from './currency';

/**
 * Escapes characters per RFC 5545 specification for text values.
 */
export function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Pads a single or double digit number with leading zero.
 */
function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Formats a Date object or components into RFC 5545 timestamp format: YYYYMMDDTHHMMSS
 */
export function toIcsDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Computes Departure and Arrival Dates/Times for a Trip Leg.
 * Accurately models flight durations via Great Circle distance when arrival time is unspecified.
 */
export function computeLegDates(leg: TripLeg): { start: Date; end: Date } {
  // Parse base departure date: YYYY-MM-DD
  const [yearStr, monthStr, dayStr] = (leg.date || '2026-06-01').split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = (parseInt(monthStr, 10) || 6) - 1;
  const day = parseInt(dayStr, 10) || 1;

  let depHour = 9;
  let depMin = 0;
  if (leg.departureTime && leg.departureTime.includes(':')) {
    const [h, m] = leg.departureTime.split(':');
    depHour = parseInt(h, 10) || 9;
    depMin = parseInt(m, 10) || 0;
  }

  const startDate = new Date(year, month, day, depHour, depMin, 0);

  let endDate: Date;
  if (leg.arrivalTime && leg.arrivalTime.includes(':')) {
    const [arrH, arrM] = leg.arrivalTime.split(':');
    const arrHour = parseInt(arrH, 10) || (depHour + 2) % 24;
    const arrMin = parseInt(arrM, 10) || 0;

    endDate = new Date(year, month, day, arrHour, arrMin, 0);
    // If arrival time is earlier than departure time, flight arrives on the next day
    if (endDate.getTime() <= startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }
  } else {
    // Estimate flight duration based on Great Circle route distance (avg ~800 km/h + 30m taxi/climb)
    const distanceKm = calculateAirDistanceKm(leg.origin, leg.destination);
    const flightMinutes = Math.max(50, Math.round((distanceKm / 780) * 60 + 30));
    endDate = new Date(startDate.getTime() + flightMinutes * 60 * 1000);
  }

  return { start: startDate, end: endDate };
}

/**
 * Generates an RFC 5545 compliant VCALENDAR string representing all flight segments in a trip.
 */
export function generateTripIcs(trip: TripItinerary, currency: SupportedCurrency = 'INR'): string {
  const now = new Date();
  const dtstamp = toIcsDateTime(now) + 'Z';
  const cleanTripTitle = trip.title ? trip.title.trim() : 'Flight Itinerary';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FPPS Global Flight Price Prediction System//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(cleanTripTitle)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  trip.legs.forEach((leg, index) => {
    const { start, end } = computeLegDates(leg);
    const dtstart = toIcsDateTime(start);
    const dtend = toIcsDateTime(end);

    const flightDesignator = leg.airlineName || leg.flightNumber
      ? `${leg.airlineName || ''} ${leg.flightNumber || ''}`.trim()
      : 'Flight';

    const summary = `${flightDesignator}: ${leg.origin} ➔ ${leg.destination} (${leg.originCity} to ${leg.destinationCity})`;
    const location = `${leg.originCity} Airport (${leg.origin}) to ${leg.destinationCity} Airport (${leg.destination})`;

    const descriptionParts: string[] = [
      `✈️ FLIGHT SEGMENT ${index + 1} OF ${trip.legs.length}`,
      `Itinerary: ${cleanTripTitle}`,
      `Route: ${leg.originCity} (${leg.origin}) ➔ ${leg.destinationCity} (${leg.destination})`,
      `Date: ${leg.date}`,
      leg.flightNumber ? `Flight Number: ${leg.flightNumber}` : '',
      leg.airlineName ? `Airline: ${leg.airlineName}` : '',
      `Cabin Class: ${leg.cabinClass.replace('_', ' ').toUpperCase()}`,
      leg.fareInr ? `Estimated Fare: ${formatCurrency(leg.fareInr, currency)}` : '',
      leg.notes ? `Notes: ${leg.notes}` : '',
      'Status: Planned & Tracked via FPPS Airfare Intelligence',
    ].filter(Boolean);

    const description = escapeIcsText(descriptionParts.join('\n'));

    // Create unique event UID
    const uid = `fpps-leg-${trip.id}-${leg.id || index}-${start.getTime()}@fpps.travel`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${escapeIcsText(location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Upcoming Flight Reminder',
      'TRIGGER:-PT3H',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generates an RFC 5545 compliant VCALENDAR string for a single flight leg.
 */
export function generateLegIcs(leg: TripLeg, tripTitle: string = 'Flight Itinerary', currency: SupportedCurrency = 'INR'): string {
  const mockTrip: TripItinerary = {
    id: 'single-leg',
    title: tripTitle,
    startDate: leg.date,
    endDate: leg.date,
    legs: [leg],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return generateTripIcs(mockTrip, currency);
}

/**
 * Triggers a browser download of an .ics file.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  // Use UTF-8 text/calendar MIME
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exports and downloads the complete trip itinerary as an .ics calendar file.
 */
export function downloadTripIcs(trip: TripItinerary, currency: SupportedCurrency = 'INR'): void {
  const content = generateTripIcs(trip, currency);
  const cleanTitle = (trip.title || 'flight_itinerary')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const filename = `${cleanTitle}_itinerary.ics`;
  downloadIcsFile(filename, content);
}

/**
 * Exports and downloads an individual flight leg as an .ics calendar file.
 */
export function downloadLegIcs(leg: TripLeg, tripTitle: string = 'Flight', currency: SupportedCurrency = 'INR'): void {
  const content = generateLegIcs(leg, tripTitle, currency);
  const cleanOrigin = leg.origin.toLowerCase();
  const cleanDest = leg.destination.toLowerCase();
  const filename = `flight_${cleanOrigin}_${cleanDest}_${leg.date}.ics`;
  downloadIcsFile(filename, content);
}
