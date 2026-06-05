import { useEffect, useState } from 'react';

/** Returns the current time, updated once per minute. Cleans up on unmount. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return now;
}
