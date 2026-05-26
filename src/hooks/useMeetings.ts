import { useEffect, useState } from 'react';
import { listMeetings } from '../lib/api/meetings';
import type { Meeting } from '../types/domain';

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    listMeetings().then((items) => {
      if (!active) return;
      setMeetings(items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { meetings, loading };
}

