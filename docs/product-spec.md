# Product Spec — Survey Insight

## Product description

A web app that turns messy survey and customer feedback CSV files into clean insights, charts, text themes, and downloadable reports. No spreadsheet skills required.

## Target users

| User | Pain point |
|---|---|
| Consultant | Spends hours cleaning client survey exports before analysis |
| Marketing agency | Needs fast NPS and CSAT summaries for client decks |
| UX researcher | Has 500 open-text responses and needs themes fast |
| Startup founder | Wants to understand churn survey results without hiring an analyst |
| Customer success team | Needs to track NPS trends across quarters |
| Small business | Has a Google Forms export and doesn't know what to do with it |

## MVP workflow (V1)

1. User creates a project.
2. User uploads a CSV file (max 10 MB, 50,000 rows).
3. App validates the file (MIME type, encoding, structure).
4. App parses the dataset and previews the first 25 rows.
5. App infers column types (rating, NPS, category, date, open_text, numeric, id).
6. User reviews and confirms column roles.
7. App validates the confirmed schema.
8. App cleans the data (nulls, whitespace, out-of-range values, date normalization).
9. App shows a cleaning summary.
10. App analyzes: ratings, NPS, categories, dates, and open-text responses.
11. App generates plain-English insights.
12. App displays a chart dashboard.
13. User downloads cleaned CSV and PDF report.

## V1 included

- CSV upload and validation
- Row preview (first 25 rows)
- Column type inference
- User-confirmed column mapping
- Schema validation
- Data cleaning pipeline
- Cleaning summary UI
- Quantitative analysis (mean, median, NPS score, category frequency, time series)
- Basic text analysis (word frequency, response length, proxy sentiment)
- Insight generation (rule-based, no AI API)
- Chart dashboard (bar, histogram, line, NPS gauge)
- Cleaned CSV export
- PDF report export
- Supabase persistence
- Email + password authentication

## V1 excluded

- XLSX upload (CSV only for MVP)
- Multi-user teams or sharing
- Payments or billing
- Advanced AI theme extraction
- Google Sheets import
- Complex background jobs / queues
- Public report sharing
- Enterprise SSO or permissions

## Data model

### Project
```
id          uuid (PK)
user_id     uuid (FK → auth.users)
name        text
status      enum (created, uploaded, previewed, mapped, analyzed, completed)
created_at  timestamptz
```

### Dataset
```
id                uuid (PK)
project_id        uuid (FK → projects)
original_filename text
row_count         integer
column_count      integer
parse_warnings    text[]
created_at        timestamptz
```

### ColumnMapping
```
id           uuid (PK)
dataset_id   uuid (FK → datasets)
column_name  text
column_type  enum (rating, nps, category, date, open_text, numeric, id, ignore, unknown)
confidence   float
confirmed_at timestamptz
```

### AnalysisResult
```
id          uuid (PK)
dataset_id  uuid (FK → datasets)
result_json jsonb   -- QuantitativeAnalysis + TextAnalysis, no raw rows
created_at  timestamptz
```

## Privacy contract

- Raw uploaded file content is never persisted to the database.
- Only aggregated analysis results (counts, averages, distributions) are stored.
- Open-text responses are never stored in the database in V1.
- Row-level security (RLS) ensures users can only access their own data.
- No user data is sent to an AI API in V1 (all analysis is local/server-side).

## Column types

| Type | Description | Analysis |
|---|---|---|
| `rating` | Bounded numeric scale (1–5, 1–10, 0–100) | Mean, median, std dev, distribution |
| `nps` | 0–10 specifically | NPS score, promoter/passive/detractor split |
| `category` | Low-cardinality string (≤ 20 unique values) | Frequency count, percentage |
| `date` | Parseable date string | Min, max, monthly response count |
| `open_text` | Long free-form string (avg > 30 chars) | Word frequency, length stats, proxy sentiment |
| `numeric` | General numeric | Mean, median, std dev, min, max |
| `id` | High-cardinality unique values | Excluded from analysis |
| `ignore` | User-marked to skip | Excluded from analysis |
| `unknown` | Fallback | Excluded from analysis |

## Acceptance criteria for V1 completion

- A user can upload a real CSV, complete all workflow steps, and download a PDF report.
- The app works without logging in (auth added in issue #21).
- No raw row data ever appears in logs, network requests, or the database.
- All four CI checks pass on `main`.
- The app deploys to Vercel without errors.
