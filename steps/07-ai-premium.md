# Step 07: AI Premium Feature — Natural Language to SQL + Insights

> **Status:** Post-MVP / Premium Feature  
> **Requires:** All MVP steps (00–06) complete  
> **Requires:** OpenAI or Anthropic API key with billing enabled

## Overview

Add an AI-powered chat interface that lets users ask questions in English and get answers as data tables or charts.

## Architecture

```
User asks: "Which 2024 SUVs have the lowest collision rates?"
    │
    ▼
Next.js API Route (/api/ai)
    │
    ├── 1. Send question + DB schema to LLM
    ├── 2. LLM returns SQL query
    ├── 3. Execute SQL against Turso DB
    └── 4. Return results + chart config
    │
    ▼
User sees: bar chart of top 10 SUVs
```

## AI Prompt Template

```typescript
const SYSTEM_PROMPT = `You are a SQL expert for Canada's national vehicle insurance rates database (IBC How Cars Measure Up).
The database has a table called "insurance_rates" with these columns:
- make (TEXT): Manufacturer name
- model (TEXT): Vehicle model name
- body_style (TEXT): One of 2D, 4D, PU, SUV, VAN, WGN
- model_year (INTEGER): 1997-2025
- power_type (TEXT): Gasoline/Diesel, Hybrid, Battery Electric, Plug-In Hybrid, Electric+Gasoline Generator
- collision (REAL): Relative collision claim cost index (100 = average)
- comp (REAL): Relative comprehensive claim cost index
- dcpd (REAL): Relative DCPD (Direct Compensation Property Damage) claim cost index
- ab (REAL): Relative Accident Benefits personal injury claim cost index
- theft_frequency (REAL): Relative theft claim frequency index

Rules:
- 100 is average. 122 = 22% above average. 87 = 13% below average.
- NULL means data not available. Use IS NOT NULL in queries.
- Return ONLY a JSON object with: { "sql": "...", "chart_type": "bar|line|table", "chart_config": { ... }, "explanation": "..." }
- For chart_type "bar", chart_config needs: { "x": "col_name", "y": "col_name", "title": "..." }
- For chart_type "line", chart_config needs: { "x": "model_year", "y": "col_name", "title": "..." }
- Limit results to 20 unless user asks for more.
- Use ROUND() on averages.`;
```

## Files to Create

### `src/app/explore/ai/page.tsx` — AI Chat Page

```tsx
export default function AIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground mt-1">
          Ask questions about Canada's insurance rates in plain English
        </p>
      </div>
      <AIChat />
    </div>
  );
}
```

### `src/app/explore/ai/ai-chat.tsx` — Chat Component

A chat UI with:
- Message list (user messages + AI responses)
- Text input + send button
- AI responses show SQL used, results (table/chart), and explanation
- Loading state while AI generates

### `src/app/api/ai/route.ts` — AI API Route

```typescript
export async function POST(request: Request) {
  const { question } = await request.json();

  // 1. Build system prompt with schema + metrics
  // 2. Call LLM with system prompt + question
  // 3. Parse JSON response (sql, chart_type, etc.)
  // 4. Execute SQL against Turso DB
  // 5. Return { sql, chart_type, chart_config, data, explanation }

  // Use OpenAI SDK or Anthropic SDK
}
```

## Monetization Options

| Approach | How | Effort |
|---|---|---|
| **Rate-limited** | Free tier: 5 queries/day. Premium: unlimited | Low |
| **API key toggle** | User brings their own API key | Medium |
| **Stripe metered** | Pay-per-query billing via Stripe | High |

## Example Questions the AI Should Handle

- *"What's the average collision rate for 2023 SUVs?"*
- *"Which Toyota models have the highest theft rates?"*
- *"Compare insurance costs between Tesla Model 3 and BMW 3 Series"*
- *"Show me the trend of DCPD rates for pickup trucks over time"*
- *"What's the cheapest-to-insure 2024 sedan?"*
- *"Which body style has the lowest accident benefit claims?"*

## Dependencies

```bash
npm install openai  # or @anthropic-ai/sdk
```

## Security Considerations

- **SQL injection:** The AI generates SQL, but you're running it yourself against your own DB. Still, add a guard that only allows `SELECT` queries.
- **Rate limiting:** Prevent abuse with Vercel KV or a simple in-memory counter.
- **Cost control:** Set max token limits and cache common queries.

## Implementation Notes

- Keep the prompt + schema in a separate file for easy tweaking
- Log all AI-generated SQL for debugging
- Add a "copy SQL" button for power users
- Cache results for identical questions within a session
- Add a disclaimer: "AI may make mistakes. Verify important results."