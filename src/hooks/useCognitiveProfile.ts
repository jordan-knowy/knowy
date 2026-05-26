import { useEffect, useState } from 'react';
import { getCognitiveProfile } from '../lib/api/contacts';
import type { CognitiveProfile } from '../types/domain';

export function useCognitiveProfile(contactId: string | null) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(contactId));

  useEffect(() => {
    let active = true;

    if (!contactId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getCognitiveProfile(contactId).then((nextProfile) => {
      if (!active) return;
      setProfile(nextProfile);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [contactId]);

  return { profile, loading };
}

