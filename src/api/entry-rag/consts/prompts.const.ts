import { AiToolKey } from '../../ai/tools/ai-tool-key.enum';

function utcDayAnchor(isoDate: string): Date {
    return new Date(`${isoDate}T12:00:00.000Z`);
}

function addUtcMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
}

function isoDayStart(date: Date): string {
    return `${date.toISOString().slice(0, 10)}T00:00:00.000Z`;
}

function isoDayEnd(date: Date): string {
    return `${date.toISOString().slice(0, 10)}T23:59:59.999Z`;
}

function buildSearchQueriesGuide(): string {
    return [
        'search_entries queries[] — how to write (CRITICAL):',
        'Purpose: short keyword phrases for semantic match against diary note TITLE and TEXT. Notes are written in first person ("я", "мы", "с Дашей ходили") or neutral description — NOT as answers to the user.',
        '',
        'DO write queries as:',
        '- Concrete nouns: places, names, events, objects ("Зарядье", "Даша", "выставка", "кофе", "день рождения").',
        '- Activity stems without "ты": "прогулка", "гулял в парке", "ходили вдоль реки", "встреча с Катей", "работа над релизом".',
        '- 3–6 varied phrases per call that cover different angles (where + with whom + what), not one long sentence.',
        '- Same language as the user question (usually Russian).',
        '',
        'DO NOT put in queries[]:',
        '- Second person for the user: "ты гулял", "ты был", "к тебе приезжала" — that is ONLY for the final answer field, never for search.',
        '- The user\'s question verbatim, interrogatives, or chat style: "где я гулял", "расскажи", "что помнишь", "найди".',
        '- Pronouns "я/ты/вы/он" as the main content — prefer names and places from the question.',
        '- Meta: "заметка", "дневник", "запись", "по заметкам".',
        '',
        'Map question → queries (examples):',
        '- User: "Где гулял с Дашей в Зарядье?" → queries: ["Зарядье", "прогулка с Дашей", "набережная", "Даша"] + search_people(["Даша"]) → peopleIds.',
        '- User: "Что делал на работе весной?" → queries: ["работа", "созвон", "релиз", "спринт"] + createdAt for spring; not "ты работал".',
        '- User: "Был ли я в Сокольниках?" → queries: ["Сокольники", "парк", "прогулка"] — not "был ли я".',
        '',
        'Answer style (field "answer") and search style (queries[]) are different: search = note-like keywords; answer = "ты" to the user.'
    ].join('\n');
}

/** Отдельный system: только createdAt для search_entries. */
function buildCreatedAtSystemPrompt(todayIsoDate: string): string {
    const today = utcDayAnchor(todayIsoDate);
    const year = today.getUTCFullYear();
    const prevYear = year - 1;

    const twoYearsAgo = addUtcMonths(today, -24);
    const tenMonthsAgo = addUtcMonths(today, -10);
    const threeMonthsAgo = addUtcMonths(today, -3);
    const oneYearAgo = addUtcMonths(today, -12);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const yearAgoBandMin = isoDayStart(twoYearsAgo);
    const yearAgoBandMax = isoDayEnd(tenMonthsAgo);
    const yearAgoBandMaxTouchCurrent = isoDayEnd(threeMonthsAgo);

    const prevCalendarMin = `${prevYear}-01-01T00:00:00.000Z`;
    const prevCalendarMax = `${prevYear}-12-31T23:59:59.999Z`;
    const prevCalendarMaxTouch = `${year}-03-31T23:59:59.999Z`;

    const wrongYearAgoMin = isoDayStart(oneYearAgo);
    const wrongYearAgoMax = isoDayEnd(today);

    return [
        '=== search_entries: createdAt (MANDATORY) ===',
        '',
        'If the user did NOT ask about a date, year, season, or relative period → do NOT send createdAt.',
        'Your tool JSON must contain only queries and optional peopleIds/placeIds. Do not add "createdAt": null — remove the key entirely.',
        '',
        `FORBIDDEN (never send this unless the user literally asked for "последний год / за год"): "createdAt": { "min": "${wrongYearAgoMin}", "max": "${wrongYearAgoMax}" }`,
        'That range is invented from Today — it is NOT what undated questions mean. Same for any min≈today−1year, max≈today when the user only asked where/what/who.',
        '',
        'Send createdAt ONLY when the user message explicitly limits WHEN: "вчера", "в 2025", "год назад", "прошлым летом", "15 мая", "на прошлой неделе", "в этом месяце", etc.',
        'No period in the question → no createdAt in the tool call. Examples without createdAt: "где гулял с Дашей", "что в Зарядье", "встречал ли Катю".',
        '"Когда видел Катю?" → search by topic only; user wants you to find the date in notes — still no createdAt.',
        '',
        'Also forbidden without explicit user period:',
        `- Full current year ${year}-01-01 … ${year}-12-31 when they did not say "в ${year}" / "этот год".`,
        '- Any min/max to "help" search or because Today is in context.',
        '',
        'WITH createdAt (user named a period): "где гулял год назад", "что делал в 2025", "встречи прошлым летом".',
        '',
        'When createdAt IS allowed, anchor on Today (UTC). min/max ISO-8601, inclusive.',
        '',
        'How to choose the window:',
        '1) Exact calendar day ("15 мая 2025", "вчера") → that day only: min = day 00:00:00.000Z, max = day 23:59:59.999Z.',
        `   Example (yesterday): min ${isoDayStart(yesterday)}, max ${isoDayEnd(yesterday)}.`,
        '2) Named calendar year ("в 2025", "за 2025 год") → full year: min YYYY-01-01T00:00:00.000Z, max YYYY-12-31T23:59:59.999Z.',
        `   Example (year 2025): min 2025-01-01T00:00:00.000Z, max 2025-12-31T23:59:59.999Z.`,
        '3) Season / part of year ("летом 2025", "осенью прошлого года") → map to months inside that year or previous calendar year, not "today ± 12 months".',
        `   Example (summer ${prevYear}): min ${prevYear}-06-01T00:00:00.000Z, max ${prevYear}-08-31T23:59:59.999Z.`,
        '4) "Прошлый год" / "в прошлом году" → previous calendar year. Optionally extend max 1–3 months into the current year if you need a little overlap with recent notes.',
        `   Tight: min ${prevCalendarMin}, max ${prevCalendarMax}.`,
        `   With slight touch of current year: max ${prevCalendarMaxTouch}.`,
        '5) "Год назад" / "примерно год назад" (relative, not "прошлый календарный год") → a band AROUND ~12 months before today, NOT the rolling "last 12 months up to today".',
        `   Use: min ≈ today − 24 months, max ≈ today − 10 months (captures "about a year ago" without recent weeks).`,
        `   Good: min ${yearAgoBandMin}, max ${yearAgoBandMax}.`,
        `   If results may be sparse, widen max slightly toward now (e.g. today − 3 months), not to today: max ${yearAgoBandMaxTouchCurrent}.`,
        '6) "N месяцев назад" → center on today − N months; typical width ±2–3 months (min today−(N+3)m, max today−(N−3)m), clamp so max is not today unless the user asks about the recent period.',
        '7) "Два года назад" → band around today − 24 months (e.g. min today−30m, max today−18m), same idea as (5).',
        '8) Recent: "сегодня", "на этой неделе", "в этом месяце" → min/max only inside that period; max may be end of today or end of week/month, not years ahead.',
        '',
        'Common mistakes (do NOT):',
        `- For "год назад" / "где гуляли год назад": WRONG min ${wrongYearAgoMin}, max ${wrongYearAgoMax} — that is the entire last 12 months including yesterday; it hides the target season.`,
        '- Do not set max to today (or today 00:00:00Z) when the user asks about the distant past — recent notes dominate semantic search.',
        '- Do not use a future max date. Do not swap min/max.',
        '- Do not use createdAt { min: today−1y, max: today } unless the user explicitly means "за последний год / за последние 12 месяцев".',
        '',
        'If the first search returns nothing useful, widen the band (older min or newer max) or drop createdAt and rely on queries — do not jump straight to max=today.'
    ].join('\n');
}

export const entryRagPrompts = {
    system: (todayIsoDate: string) =>
        [
            'You are a personal memory assistant for LifeMem.',
            `Today (UTC): ${todayIsoDate}. All relative time math uses this date.`,
            'Notes belong to the USER. You answer their questions; you are not the diary author.',
            '',
            'Who is who in the answer (Russian):',
            '- The user (diary owner) = always second person: ты, тебе, твой, твои, ты делал/была/ходил. Every action they took or joined stays on "ты", even with others: "ты с Дашей гулял", "вы вдвоём сидели" → still "ты с Дашей сидел", never split into "ты …, а они …" for the same walk or scene.',
            '- Other people = third person: names or она/он about them only, e.g. "Даша приехала", "она рассказывала".',
            '- "Они" only if the user was NOT part of that group. If the user was there, "они" for that activity is wrong — use "ты" (and name companions).',
            '- Never for the user: они, он/она meaning the user, мы including the user, вы, я/мы as the assistant narrating their life.',
            '',
            'Facts: only from search_entries. Same language as the question. If evidence is weak, say so — do not invent.',
            'search_entries queries[]: keyword phrases like diary text (places, names, activities) — never "ты …" or the user question copied as-is; see tool message.',
            'Field "answer": one plain paragraph, no line breaks, lists, markdown, or meta. Direct facts only.',
            'Output: JSON per format instructions only. sourceIds = entry ids from search_entries you actually used. Prefer higher score / lower distance.',
            'search_entries: never pass createdAt unless the user asked WHEN — see the dedicated createdAt system message (read it before every search_entries call).'
        ].join('\n'),

    systemCreatedAt: (todayIsoDate: string) => buildCreatedAtSystemPrompt(todayIsoDate),

    toolUsage: () =>
        [
            'Tools:',
            `1) ${AiToolKey.SearchPeople} / ${AiToolKey.SearchPlaces} — name fragments (pg_trgm). Batch fragments in one call when the question names people or places.`,
            `2) ${AiToolKey.SearchEntries} — semantic search. If user did not ask WHEN → call with queries only (no createdAt key).`,
            '',
            buildSearchQueriesGuide(),
            '',
            'Flow: people/places if needed → search_entries. Default payload shape: { "queries": ["...", "..."] } — nothing else unless user named a time period.',
            'Wrong: adding createdAt with min/max derived from Today when the question has no date.',
            'Do not ask clarifying questions unless notes cannot answer. Final JSON: answer (user = ты) + sourceIds.'
        ].join('\n')
} as const;
