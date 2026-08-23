/**
 * nGazete yayin takvimi.
 *
 * Seed, okuyucu ve Yayin Atolyesi ayni 06.00 sinirini kullanir. Kurali tek
 * yerde tutmak, sunucu saat dilimi UTC oldugunda farkli yayin anlari
 * uretilmesini engeller.
 */
import { ISTANBUL_OFFSET_MINUTES } from '@/lib/time';

export const NEWSPAPER_PUBLISH_HOUR = 6;

/** YYYY-MM-DD sayisini Istanbul saatiyle 06.00 anina cevirir. */
export function newspaperIssuePublishAt(issueDate: string): Date {
  const utcMidnight = new Date(`${issueDate}T00:00:00.000Z`);
  const utcMinutes = NEWSPAPER_PUBLISH_HOUR * 60 - ISTANBUL_OFFSET_MINUTES;
  return new Date(utcMidnight.getTime() + utcMinutes * 60_000);
}
