import type { CognitiveProfile } from '../../server/schemas/cognitive-profile.schema';

export const cognitiveProfiles: CognitiveProfile[] = [
  {
    contactId: 'contact_sarah',
    profileVersion: 7,
    globalConfidence: 72,
    summary:
      'Profil orienté résultat avec forte tolérance à l’incertitude. Les signaux convergent vers une posture Challenger/Strategist, à valider en ouverture.',
    axes: [
      { axis: 'relation_result', value: 76, confidence: 68, level: 'inferred', evidenceCount: 9 },
      { axis: 'intuition_structure', value: 42, confidence: 61, level: 'inferred', evidenceCount: 6 },
      { axis: 'caution_speed', value: 70, confidence: 64, level: 'inferred', evidenceCount: 7 },
      { axis: 'consensus_control', value: 55, confidence: 49, level: 'hypothetical', evidenceCount: 3 },
    ],
    interactionModes: [
      { mode: 'Challenger', score: 81, confidence: 66, evidenceCount: 8 },
      { mode: 'Strategist', score: 74, confidence: 58, evidenceCount: 5 },
      { mode: 'Explorer', score: 61, confidence: 44, evidenceCount: 3 },
    ],
    signals: [
      {
        id: 'signal_sarah_1',
        type: 'career_mobility',
        text: 'A travaillé entre Paris et San Francisco sur des partenariats SaaS.',
        inference: 'Tolérance à l’incertitude et aisance avec les environnements ambigus.',
        level: 'inferred',
        confidence: 62,
        sourceType: 'linkedin_public',
        sourceRef: 'linkedin:sarah',
        observedAt: '2026-05-20',
      },
      {
        id: 'signal_sarah_2',
        type: 'communication_pattern',
        text: 'Réponses email courtes, souvent centrées sur next step et deadline.',
        inference: 'Préférence pour une communication directe et orientée action.',
        level: 'observable',
        confidence: 78,
        sourceType: 'gmail',
        sourceRef: 'thread:q1-review',
        observedAt: '2026-05-24',
      },
    ],
    relationships: [
      {
        fromContactId: 'contact_sarah',
        toContactId: 'contact_marc',
        relationType: 'validates',
        strength: 68,
        confidence: 54,
        sourceType: 'calendar',
      },
    ],
    updatedFrom: ['gmail', 'calendar', 'linkedin_public'],
  },
  {
    contactId: 'contact_marc',
    profileVersion: 4,
    globalConfidence: 64,
    summary:
      'Profil Validator/Operator probable. Les signaux observés montrent une forte demande de structure, de preuves et de métriques.',
    axes: [
      { axis: 'relation_result', value: 84, confidence: 71, level: 'observable', evidenceCount: 11 },
      { axis: 'intuition_structure', value: 82, confidence: 69, level: 'observable', evidenceCount: 10 },
      { axis: 'caution_speed', value: 38, confidence: 56, level: 'inferred', evidenceCount: 5 },
      { axis: 'consensus_control', value: 63, confidence: 45, level: 'hypothetical', evidenceCount: 2 },
    ],
    interactionModes: [
      { mode: 'Validator', score: 86, confidence: 72, evidenceCount: 9 },
      { mode: 'Operator', score: 73, confidence: 60, evidenceCount: 6 },
    ],
    signals: [
      {
        id: 'signal_marc_1',
        type: 'objection_pattern',
        text: 'Demande répétée de benchmarks, ROI et intégration technique.',
        inference: 'La réunion doit apporter des preuves chiffrées avant toute vision large.',
        level: 'observable',
        confidence: 82,
        sourceType: 'gmail',
        sourceRef: 'thread:roi-benchmark',
        observedAt: '2026-05-23',
      },
    ],
    relationships: [],
    updatedFrom: ['gmail', 'calendar'],
  },
];

