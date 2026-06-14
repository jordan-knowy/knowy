// Veille d'actualités d'entreprise (Feed signaux Home).
// Pour chaque compte de l'org : recherche publique (Perplexity/web) → structuration IA → company_signals.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const PERPLEXITY_API = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar';

// Map mot-clé → famille (cohérent avec le Feed Home)
function classifyFamily(typeOrText: string): string {
  const s = (typeOrText || '').toLowerCase();
  if (/churn|faillite|liquidation|cessation|redressement/.test(s)) return 'churn';
  if (/risque|litige|proc[eè]s|sanction|alerte|d[ée]part/.test(s)) return 'risque';
  if (/lev[ée]e|fund|financement|croissance|recrut|expansion|embauche|hiring/.test(s)) return 'croissance';
  if (/rachat|acquisition|fusion|m&a|cession|prise de participation|controle/.test(s)) return 'marche';
  if (/nomination|promotion|nouveau (dg|ceo|directeur)|arriv[ée]e|mobilit/.test(s)) return 'mobilite';
  if (/partenariat|contrat|lancement|produit|opportunit|appel d'offres/.test(s)) return 'levier';
  return 'presence';
}

async function newsForCompany(key: string, name: string, domain: string | null): Promise<any[]> {
  const prompt = `Recherche les ACTUALITÉS PUBLIQUES récentes (12 derniers mois) sur l'entreprise "${name}"${domain ? ` (site ${domain})` : ''}.
Sources : presse, LinkedIn (page entreprise), communiqués, registres (BODACC/Pappers).
Cherche : levée de fonds / financement, rachat / fusion / M&A, changement de dirigeant ou nomination, recrutement / croissance / expansion, lancement produit, partenariat, litige / risque, procédure.

Réponds UNIQUEMENT par un tableau JSON (max 4 items, les plus récents/pertinents), sans texte autour :
[{"type":"levee_fonds|rachat|dirigeant|recrutement|produit|partenariat|risque|autre","title":"titre court factuel","summary":"1-2 phrases factuelles","source":"Presse|LinkedIn|Registres|Web","source_url":"url si dispo sinon null","date":"AAAA-MM ou AAAA-MM-JJ si connu sinon null"}]
Règle stricte : n'invente RIEN. Si aucune actualité fiable trouvée, renvoie [].`;

  try {
    const res = await fetch(PERPLEXITY_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          { role: 'system', content: 'Veille B2B factuelle. Données publiques vérifiables uniquement, avec source. Aucune hallucination. Réponds en JSON strict.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.1,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';
    const m = content.match(/\[[\s\S]*\]/);
    if (!m) return [];
    const arr = JSON.parse(m[0]);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const auth = req.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing authorization header' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
  if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { organizationId, limit = 8 } = body;
  if (!organizationId) return jsonResponse({ error: 'organizationId required' }, 400);

  const key = Deno.env.get('PERPLEXITY_API_KEY');
  if (!key) return jsonResponse({ error: 'Veille indisponible (PERPLEXITY_API_KEY manquant).', code: 'NO_KEY' }, 500);

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, domain')
    .eq('organization_id', organizationId)
    .limit(limit);

  if (!companies?.length) return jsonResponse({ success: true, inserted: 0, message: 'Aucun compte à surveiller.' });

  let inserted = 0;
  const rows: any[] = [];
  for (const c of companies as any[]) {
    const items = await newsForCompany(key, c.name, c.domain);
    for (const it of items) {
      if (!it?.title) continue;
      let observedAt: string | null = null;
      if (it.date) {
        const d = String(it.date);
        observedAt = /^\d{4}-\d{2}$/.test(d) ? `${d}-01T00:00:00Z` : (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : null);
      }
      rows.push({
        organization_id: organizationId,
        company_id: c.id,
        family: classifyFamily(`${it.type} ${it.title}`),
        title: String(it.title).slice(0, 300),
        summary: it.summary ? String(it.summary).slice(0, 800) : null,
        source: it.source ?? 'Web',
        source_url: it.source_url ?? null,
        observed_at: observedAt,
        confidence: 0.6,
        status: 'candidate',
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (rows.length) {
    const { error, count } = await supabase
      .from('company_signals')
      .upsert(rows, { onConflict: 'organization_id,company_id,title', ignoreDuplicates: true, count: 'exact' });
    if (error) return jsonResponse({ error: error.message }, 500);
    inserted = count ?? rows.length;
  }

  return jsonResponse({ success: true, inserted, scanned: companies.length });
});
