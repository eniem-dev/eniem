export function formatExpiryTime(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const minutes = Math.floor(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}
