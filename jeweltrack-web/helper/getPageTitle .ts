

const isIdLike = (segment: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const mongoIdRegex = /^[0-9a-f]{24}$/i;
  const numericIdRegex = /^\d+$/;

  return (
    uuidRegex.test(segment) ||
    mongoIdRegex.test(segment) ||
    numericIdRegex.test(segment)
  );
};

export const getPageTitle = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Dashboard';

  // Walk backward, skip ID-like segments
  const nearest = [...segments].reverse().find((seg) => !isIdLike(seg));

  return nearest ? nearest.replace(/-/g, ' ') : 'Dashboard';
};