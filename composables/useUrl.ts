import config from '~/config.json';

export const useUrl = () => {
  function withoutTrailingSlash(path: string): string {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function getVoieCyclablePath(line: string) {
    return `/${config.slug}-${line}`;
  }

  function getVoieCyclableRegex() {
    return new RegExp(`${config.slug}-([A-Z])\\b`);
  }

  return { withoutTrailingSlash, getVoieCyclablePath, getVoieCyclableRegex };
};
