export const sanitizeLikePatternTerm = (value: string) =>
  value.replace(/[%_*,().]/g, " ").replace(/\s+/g, " ").trim();
