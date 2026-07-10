import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getActiveOrganizationId } from '../../../lib/api/org';

// Logo Tohu par défaut (PNG), servi depuis le bucket Supabase Storage "branding" —
// utilisé pour favicon / meta OG / emails, où le SVG inline n'est pas exploitable.
export const TOHU_LOGO_URL = 'https://bgmtzwfafcgjklgygvtx.supabase.co/storage/v1/object/public/branding/tohu-logo.png';

// Icône réseau — reprise à l'identique du tracé SVG de la maquette (sidebar .tohu-mk).
export function TohuMark({ size = 39 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="7 -1 104 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="translate(6,-5)">
        <circle cx="14" cy="34" r="2" fill="#6E50C8" opacity=".16" />
        <circle cx="10" cy="70" r="2.6" fill="#6E50C8" opacity=".2" />
        <circle cx="22" cy="92" r="2" fill="#6E50C8" opacity=".28" />
        <circle cx="28" cy="20" r="1.8" fill="#6E50C8" opacity=".18" />
        <circle cx="26" cy="52" r="2.4" fill="#6E50C8" opacity=".34" />
        <circle cx="38" cy="80" r="2.6" fill="#6E50C8" opacity=".46" />
        <path d="M38 80 L60 62 M26 52 L52 46" stroke="#6E50C8" strokeWidth="1" opacity=".22" fill="none" />
        <line x1="60" y1="62" x2="80" y2="42" stroke="#6E50C8" strokeWidth="2.2" />
        <line x1="60" y1="62" x2="94" y2="66" stroke="#6E50C8" strokeWidth="2.2" />
        <line x1="60" y1="62" x2="76" y2="90" stroke="#6E50C8" strokeWidth="2.2" />
        <line x1="60" y1="62" x2="52" y2="46" stroke="#6E50C8" strokeWidth="2.2" />
        <circle cx="80" cy="42" r="4.6" fill="#2EA86A" />
        <circle cx="94" cy="66" r="4" fill="#6E50C8" />
        <circle cx="76" cy="90" r="4" fill="#6E50C8" />
        <circle cx="52" cy="46" r="3.6" fill="#2896A8" />
        <circle cx="60" cy="62" r="7.6" fill="#6E50C8" />
      </g>
    </svg>
  );
}

/**
 * Logo de marque — affiche le logo personnalisé de l'organisation active
 * (organizations.logo_url, webp en data URL) s'il existe, sinon le lockup Tohu
 * par défaut : icône réseau SVG + wordmark "tohu." — reproduit à l'identique
 * de la maquette (.sb-logo/.tohu-mk/.tohu-wd/.wd-dot).
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

  return (
    <div className="flex items-center" style={{ gap: 9 }}>
      <TohuMark size={compact ? 28 : 39} />
      <span style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 800, fontSize: compact ? 19 : 26, color: '#1A1040', letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap' }}>
        tohu<span style={{ color: '#6E50C8', fontWeight: 800 }}>.</span>
      </span>
    </div>
  );
}
