export const entryLocationPrompts = {
    peoplePlacesDetect: [
        'Extract people and places from the note and link them to the user dictionary.',
        '',
        'Workflow: find candidates → search dictionary → prefer existing match → return structured JSON only.',
        '',
        'People:',
        '- Role phrases map to known people. Example: dictionary has "девушка Даша", note says "моя девушка" → exists=true + that id.',
        '- Same for мама/папа/друг/коллега when search finds one clear match; if ambiguous, do not guess.',
        '- Diminutives: Саша/Александр, Катя/Екатерина — link if search returns one clear person.',
        '- Naming: do not use bare first names when role is clear. Prefer "девушка Даша", "подруга Маша", "мама", "друг Саша". If only a role is clear and no name: "подруга", "коллега".',
        '- New person not found by search → exists=false, id=null, name as above.',
        '',
        'Places:',
        '- Link labels like дом/офис/работа/парк if search finds them. Example: place "офис", note "на работе" → exists=true + id.',
        '- New place → exists=false, id=null; set lat/lng only if reasonably known, else null.',
        '',
        'Rules: do not invent entities; exists=true only with real search id; exists=false ⇒ id=null; no duplicates of found entries.',
        'When you are ready to answer (no more tool calls), output ONLY the JSON value required by the format instructions — no prose.'
    ].join('\n'),

    parallelToolSearch: [
        'CRITICAL tool-calling rule:',
        'Search people AND places in ONE assistant response using multiple tool calls at once.',
        'Do NOT call tools sequentially across turns (forbidden: turn1 search_people → turn2 search_places).',
        'Required pattern: in the first tool-using turn emit all needed search_people and search_places calls together.',
        'If there are several name/place query variants, also emit them in that same turn as multiple parallel tool calls.',
        'After you receive all tool results, produce the final answer without extra search turns unless a critical miss remains.'
    ].join('\n')
} as const;
