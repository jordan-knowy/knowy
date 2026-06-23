import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getActiveOrganizationId } from '../../../lib/api/org';

/**
 * Logo de marque — affiche le logo personnalisé de l'organisation active
 * (organizations.logo_url, webp en data URL) s'il existe, sinon le logo texte Knowr.
 * Réutilisable partout (sidebar haut/bas, etc.).
 */
export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const oid = await getActiveOrganizationId();
      if (!oid) return;
      const { data } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', oid)
        .maybeSingle();
      if (!cancelled) setLogo((data as any)?.logo_url ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (logo) {
    return (
      <img
        src={logo}
        alt="Logo"
        style={{ maxHeight: compact ? 28 : 36, maxWidth: compact ? 120 : 170, objectFit: 'contain' }}
      />
    );
  }

  // Repli : logo texte Knowr
  return (
    <div className="flex flex-col gap-0.5">
      <h1 style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: compact ? '16px' : '20px', letterSpacing: '-0.03em', color: 'var(--t1, #1A1040)', lineHeight: 1 }}>
        Know<span style={{ color: 'var(--violet, #6E50C8)' }}>r</span>
      </h1>
      {!compact && (
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.10em', color: 'var(--t3, #9082B8)' }}>
          OS Relationnel
        </p>
      )}
    </div>
  );
}
