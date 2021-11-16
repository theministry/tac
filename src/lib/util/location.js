export const getLocation = (location) => {
  if (location === "meeting") return "Meeting Space";
  if (location === "coworking") return "Co-working Space";
  if (location === "common") return "Common Space";
  if (location === "atelier") return "Private Space";
  return "other";
};