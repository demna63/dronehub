
export const URL_REGEX = /(https?:\/\/[^\s$.?#].[^\s]*)/gi;

export const extractFirstUrl = (text: string): string | null => {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
};

export const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

export const getDomainName = (url: string) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};
