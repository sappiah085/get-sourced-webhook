export const getPlatform = (userAgent: string): string => {
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }
  if (/android/i.test(userAgent)) {
    return "Android";
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "iOS";
  }
  if (/macintosh/i.test(userAgent)) {
    return "MacOS";
  }
  return "Unknown";
};
