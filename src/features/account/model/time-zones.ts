export function timeZoneOptions(...required: string[]): string[] {
  const zones = new Set(Intl.supportedValuesOf('timeZone'));
  for (const zone of required) {
    if (zone.length > 0) {
      zones.add(zone);
    }
  }
  return Array.from(zones).sort((a, b) => a.localeCompare(b));
}
