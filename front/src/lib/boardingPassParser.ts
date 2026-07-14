export interface BoardingPassData {
  lastName: string;
  firstName: string;
  pnr: string;
  routing: string;
  flightNumber: string;
  seat: string;
  sequenceNumber: string;
  date: string;
  rawData: string;
  isWrongAirport: boolean;
  carrierCode: string;
}

export function parseBoardingPass(
  data: string,
  carrierCode: string,
): BoardingPassData | null {
  if (!data) return null;

  const nameMatch = data.match(/^[MF]\d([A-Z]+)\/([A-Z]+)/);
  if (!nameMatch) return null;

  const lastName = nameMatch[1];
  const firstName = nameMatch[2];

  const pnrMatch = data.match(/\/[A-Z]+\s+([A-Z0-9]{5,6})/);
  const pnr = pnrMatch ? pnrMatch[1] : "";

  // Routing (6 letters) followed by carrier code (if provided)
  const routingRegex = carrierCode
    ? new RegExp(`\\s([A-Z]{6})${carrierCode}`)
    : /\s([A-Z]{6})[A-Z0-9]{2,3}/;
  const routingMatch = data.match(routingRegex);
  const routing = routingMatch ? routingMatch[1] : "";

  const flightRegex = carrierCode
    ? new RegExp(`${carrierCode}\\s*(\\d{3,4})`)
    : /([A-Z]{2,3})\s*(\d{3,4})/;
  const flightMatch = data.match(flightRegex);
  let flightNumber = "";
  let detectedCarrier = carrierCode;
  if (flightMatch) {
    if (carrierCode) {
      flightNumber = flightMatch[1];
    } else {
      detectedCarrier = flightMatch[1];
      flightNumber = flightMatch[2];
    }
  }

  const origin = routing.substring(0, 3);
  const isWrongAirport = origin !== "XCR";

  const julianMatch = data.match(/\s(\d{3})Y/);
  const julianDay = julianMatch ? julianMatch[1] : "";
  const date = julianDay ? parseJulianDate(julianDay) : "";

  const seatMatch = data.match(/(\d{3})([A-Z])\d{4}/);
  const seat = seatMatch ? `${parseInt(seatMatch[1], 10)}${seatMatch[2]}` : "";

  const seqMatch = data.match(/\b\d{3}[A-Z]\d{3}[A-Z](\d{4})\b/);
  const sequenceNumber = seqMatch ? seqMatch[1] : "";

  return {
    lastName,
    firstName,
    pnr,
    routing,
    flightNumber,
    seat,
    sequenceNumber,
    date,
    rawData: data,
    isWrongAirport,
    carrierCode: detectedCarrier,
  };
}

function parseJulianDate(julian: string): string {
  if (!julian || julian.length !== 3) return "";
  const year = new Date().getUTCFullYear();
  const dayOfYear = Number(julian);
  if (dayOfYear < 1 || dayOfYear > 366) return "";
  const date = new Date(Date.UTC(year, 0, dayOfYear));
  return date.toISOString().split("T")[0];
}

export function dateToJulian(dateStr: string): string {
  if (!dateStr) return "";
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const current = new Date(Date.UTC(year, month - 1, day));
  const diff = current.getTime() - jan1.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return String(dayOfYear).padStart(3, "0");
}

export function formatRouting(routing: string): { from: string; to: string } {
  if (routing.length === 6) {
    return {
      from: routing.substring(0, 3),
      to: routing.substring(3, 6),
    };
  }
  return { from: routing, to: "" };
}

export function formatDateToDDMMMYY(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}
