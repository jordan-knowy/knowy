import { useCallback, useEffect, useState } from 'react';
import { listMeetings } from '../lib/api/meetings';
import type { Meeting } from '../types/domain';

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    listMeetings().then((items) => {
      if (!active) return;
      setMeetings(items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [version]);

  const reload = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  return { meetings, loading, reload };
}
