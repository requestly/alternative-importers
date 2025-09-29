export const unthrowableParseJson = (rawData: string) => {
  try {
    return JSON.parse(rawData);
  } catch (err) {
    return null;
  }
};
