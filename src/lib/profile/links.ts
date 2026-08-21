import type { IconName } from '@/components/ui';
import type { ProfileLinkPlatform } from '@/types/domain';

const PLATFORM_HOSTS: Array<{ platform: ProfileLinkPlatform; hosts: string[] }> = [
  { platform: 'instagram', hosts: ['instagram.com'] },
  { platform: 'github', hosts: ['github.com'] },
  { platform: 'linkedin', hosts: ['linkedin.com'] },
  { platform: 'youtube', hosts: ['youtube.com', 'youtu.be'] },
  { platform: 'x', hosts: ['x.com', 'twitter.com'] },
];

export function normalizeProfileUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function profileLinkPlatform(url: URL): ProfileLinkPlatform {
  const hostname = url.hostname.replace(/^www\./, '').toLocaleLowerCase('tr-TR');
  return (
    PLATFORM_HOSTS.find(({ hosts }) => hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)))
      ?.platform ?? 'website'
  );
}

export function profileLinkIcon(platform: ProfileLinkPlatform): IconName {
  return platform === 'website' ? 'link' : platform;
}

export function profileLinkDefaultLabel(platform: ProfileLinkPlatform, url: URL): string {
  const labels: Record<ProfileLinkPlatform, string> = {
    instagram: 'Instagram',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    x: 'X',
    website: url.hostname.replace(/^www\./, ''),
  };
  return labels[platform];
}
