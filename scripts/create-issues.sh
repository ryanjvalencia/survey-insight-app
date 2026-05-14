#!/usr/bin/env bash
# Usage: GITHUB_TOKEN=ghp_... bash scripts/create-issues.sh
# Creates the full MVP issue backlog for ryanjvalencia/survey-insight-app

set -euo pipefail

REPO="ryanjvalencia/survey-insight-app"
API="https://api.github.com/repos/${REPO}/issues"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Error: GITHUB_TOKEN is not set."
  echo "Run: GITHUB_TOKEN=ghp_... bash scripts/create-issues.sh"
  exit 1
fi

create_issue() {
  local title="$1"
  local body="$2"
  local labels="${3:-}"

  local payload
  if [[ -n "$labels" ]]; then
    payload=$(jq -n \
      --arg t "$title" \
      --arg b "$body" \
      --argjson l "$labels" \
      '{"title": $t, "body": $b, "labels": $l}')
  else
    payload=$(jq -n \
      --arg t "$title" \
      --arg b "$body" \
      '{"title": $t, "body": $b}')
  fi

  local response
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$API" \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local http_code
  http_code=$(echo "$response" | tail -1)
  local body_resp
  body_resp=$(echo "$response" | head -n -1)

  if [[ "$http_code" == "201" ]]; then
    local url
    url=$(echo "$body_resp" | jq -r '.html_url')
    echo "  Created: $url"
  else
    echo "  FAILED (HTTP $http_code): $(echo "$body_resp" | jq -r '.message // "unknown error"')"
  fi
}

echo "Creating GitHub issues for ${REPO}..."
echo ""

# ── 1. Base project structure ────────────────────────────────────────────────
echo "[1/23] Base project structure"
create_issue \
  "Base project structure" \
  "## Goal
Establish a single, well-structured Next.js App Router project with all required tooling configured and passing CI.

## Background
The repo currently contains two nested Next.js scaffolds: a root project and a \`survey-insight-app/\` subdirectory. The root \`package.json\` is missing \`typecheck\`, \`test\`, and Vitest. CI expects all four scripts to pass (\`lint\`, \`typecheck\`, \`test\`, \`build\`). This must be resolved before any feature work begins.

## Requirements
- Single Next.js App Router project at the repo root (remove or absorb the nested subdirectory)
- \`package.json\` includes \`lint\`, \`typecheck\`, \`test\`, \`test:watch\`, \`dev\`, \`build\`, \`start\`
- Vitest configured with a \`vitest.config.ts\`
- TypeScript strict mode enabled in \`tsconfig.json\`
- Tailwind CSS v4 configured
- ESLint configured via \`eslint.config.mjs\` (next/core-web-vitals)
- \`src/\` directory layout: \`src/app/\`, \`src/lib/\`, \`src/components/\`, \`src/types/\`
- Smoke test passes (\`src/lib/smoke.test.ts\`)
- All four CI steps pass on a clean install

## Acceptance criteria
- [ ] \`npm run lint\` exits 0
- [ ] \`npm run typecheck\` exits 0
- [ ] \`npm test\` exits 0 (smoke test passes)
- [ ] \`npm run build\` exits 0
- [ ] No nested duplicate project directory
- [ ] \`src/lib/\`, \`src/components/\`, \`src/types/\` directories exist

## Suggested files
- \`package.json\`
- \`tsconfig.json\`
- \`vitest.config.ts\`
- \`eslint.config.mjs\`
- \`next.config.ts\`
- \`postcss.config.mjs\`
- \`src/lib/smoke.test.ts\`

## Tests required
- Smoke test confirming Vitest is wired up

## Dependencies
None — this is the foundation for all other issues.

## Estimated complexity
Small (1–2 hours)" \
  '["setup","no-feature"]'

# ── 2. Landing page ──────────────────────────────────────────────────────────
echo "[2/23] Landing page"
create_issue \
  "Landing page" \
  "## Goal
Replace the default Next.js placeholder with a minimal, on-brand landing page that communicates the product value and links to the upload flow.

## Requirements
- Route: \`/\` (replaces \`src/app/page.tsx\`)
- Hero section: product name, one-line value prop, primary CTA button linking to \`/upload\`
- Brief feature list (3–5 bullet points drawn from the product spec)
- Responsive layout using Tailwind CSS
- No authentication required at this stage
- No external images or heavy assets

## Acceptance criteria
- [ ] \`/\` renders without errors
- [ ] CTA button navigates to \`/upload\`
- [ ] Page is readable on mobile (320px) and desktop (1280px)
- [ ] No console errors or TypeScript errors

## Suggested files
- \`src/app/page.tsx\`
- \`src/components/ui/Button.tsx\` (if a shared button component is introduced)

## Tests required
None required for this issue (UI-only, no data logic).

## Dependencies
- #1 Base project structure

## Estimated complexity
Small (1–2 hours)" \
  '["ui","frontend"]'

# ── 3. Dashboard shell ───────────────────────────────────────────────────────
echo "[3/23] Dashboard shell"
create_issue \
  "Dashboard shell" \
  "## Goal
Create the persistent app shell layout used by all authenticated/app routes: top navigation bar, optional sidebar, and a main content slot.

## Requirements
- Shared layout component at \`src/app/(app)/layout.tsx\` using a route group
- Top nav: app name/logo, navigation links (Upload, Projects placeholder)
- Main content area renders \`{children}\`
- Layout is responsive
- Active route is highlighted in the nav
- No authentication enforcement yet (added in a later issue)

## Acceptance criteria
- [ ] \`/upload\` and future app routes render inside the shell
- [ ] Navigation links are present and correct
- [ ] Layout renders without TypeScript or console errors
- [ ] Responsive on mobile and desktop

## Suggested files
- \`src/app/(app)/layout.tsx\`
- \`src/components/layout/Nav.tsx\`
- \`src/components/layout/Shell.tsx\`

## Tests required
None required (layout/UI only).

## Dependencies
- #1 Base project structure

## Estimated complexity
Small (1–3 hours)" \
  '["ui","frontend"]'

# ── 4. Upload page UI ────────────────────────────────────────────────────────
echo "[4/23] Upload page UI"
create_issue \
  "Upload page UI" \
  "## Goal
Build the file upload page where users select or drag-and-drop a CSV file to begin the analysis workflow.

## Requirements
- Route: \`/upload\` inside the app shell
- Drag-and-drop zone and a fallback file input (\`<input type=\"file\">\`)
- Accepted types shown to user: \`.csv\` only for MVP (XLSX in a later iteration)
- File size limit shown: 10 MB
- Selected file name and size displayed before submit
- \"Analyze\" submit button; disabled until a file is selected
- Client-side MIME type and size check before any network call (show inline error if invalid)
- Loading state while upload is in progress
- No actual upload logic in this issue — wire to a stub handler that returns immediately

## Acceptance criteria
- [ ] User can select a file via click or drag-and-drop
- [ ] Invalid file type shows an inline error message, does not submit
- [ ] File > 10 MB shows an inline error message, does not submit
- [ ] Submit button is disabled with no file selected
- [ ] Loading spinner shown on submit
- [ ] No TypeScript or console errors

## Suggested files
- \`src/app/(app)/upload/page.tsx\`
- \`src/components/upload/DropZone.tsx\`
- \`src/components/upload/FileInfo.tsx\`
- \`src/lib/upload/validate-file-client.ts\`

## Tests required
- Unit tests for \`validate-file-client.ts\` (MIME type and size checks)

## Dependencies
- #3 Dashboard shell

## Estimated complexity
Medium (3–5 hours)" \
  '["ui","frontend"]'

# ── 5. CSV validation ────────────────────────────────────────────────────────
echo "[5/23] CSV validation"
create_issue \
  "CSV validation" \
  "## Goal
Implement server-side CSV validation in a Route Handler. Validate the uploaded file before any parsing occurs.

## Requirements
- Route Handler: \`POST /api/upload/validate\` (or \`POST /api/projects/[id]/validate\`)
- Accepts \`multipart/form-data\` with a \`file\` field
- Validates: MIME type (\`text/csv\`), file size (≤ 10 MB), non-empty file
- Reads only the first 4 KB to check for BOM, encoding, and delimiter detectability — does not buffer the whole file in memory for this step
- Returns structured JSON: \`{ valid: boolean, error?: string }\`
- Does NOT log raw file content
- Returns appropriate HTTP status codes (400 for invalid, 200 for valid)

## Acceptance criteria
- [ ] Valid CSV returns \`{ valid: true }\` with HTTP 200
- [ ] Non-CSV MIME type returns \`{ valid: false, error: \"...\" }\` with HTTP 400
- [ ] Empty file returns \`{ valid: false, error: \"...\" }\` with HTTP 400
- [ ] File > 10 MB returns \`{ valid: false, error: \"...\" }\` with HTTP 400
- [ ] No raw row data is logged at any level

## Suggested files
- \`src/app/api/upload/validate/route.ts\`
- \`src/lib/upload/validate-file-server.ts\`

## Tests required
- Unit tests for \`validate-file-server.ts\` covering all validation rules
- At least one integration test for the route handler

## Dependencies
- #1 Base project structure
- #4 Upload page UI (wires up the real endpoint)

## Estimated complexity
Small–Medium (2–4 hours)" \
  '["backend","data-pipeline"]'

# ── 6. CSV parsing ───────────────────────────────────────────────────────────
echo "[6/23] CSV parsing"
create_issue \
  "CSV parsing" \
  "## Goal
Implement a reusable CSV parsing module that converts a validated CSV file into a structured in-memory dataset.

## Requirements
- Pure library module (no HTTP concerns): \`src/lib/parse/parse-csv.ts\`
- Accepts a \`File\` or \`Buffer\` / \`ReadableStream\`
- Auto-detects delimiter (comma, semicolon, tab) using a heuristic on the first line
- Handles BOM (\`\\uFEFF\`)
- Returns \`{ headers: string[], rows: Record<string, string>[], rowCount: number, parseWarnings: string[] }\`
- Strips leading/trailing whitespace from headers and cell values
- Max 50,000 rows for MVP; returns a \`parseWarning\` if truncated
- Does NOT log row data
- No large CSV-parser dependency without justification (prefer a lightweight approach or the built-in \`TextDecoder\` + manual split for simple cases, or justify adding \`papaparse\`)

## Acceptance criteria
- [ ] Parses comma-delimited CSV correctly
- [ ] Parses semicolon-delimited CSV correctly
- [ ] Strips BOM from headers
- [ ] Whitespace is trimmed from headers and values
- [ ] Files over 50,000 rows are truncated with a warning
- [ ] Malformed rows produce a warning, not a throw
- [ ] No raw row content in logs

## Suggested files
- \`src/lib/parse/parse-csv.ts\`
- \`src/types/dataset.ts\` (shared \`Dataset\`, \`ParseResult\` types)

## Tests required
- Unit tests covering: comma CSV, semicolon CSV, BOM, whitespace trimming, row truncation, malformed row warning

## Dependencies
- #1 Base project structure
- #5 CSV validation (parsing runs after validation passes)

## Estimated complexity
Medium (3–5 hours)" \
  '["backend","data-pipeline"]'

# ── 7. Data preview screen ───────────────────────────────────────────────────
echo "[7/23] Data preview screen"
create_issue \
  "Data preview screen" \
  "## Goal
Show the user the first 25 rows of their uploaded CSV in a readable table so they can confirm the file parsed correctly before proceeding.

## Requirements
- Route: \`/projects/[id]/preview\` (or inline step on \`/upload\` after parse)
- Scrollable horizontal table showing all columns and first 25 rows
- Header row is sticky
- Row count and column count displayed above the table
- Any \`parseWarnings\` from the parser shown as dismissible banners
- \"Continue\" button navigates to column mapping
- \"Re-upload\" button navigates back to \`/upload\`
- Data is never written to console/logs

## Acceptance criteria
- [ ] Table renders all columns from parsed result
- [ ] Only 25 rows shown
- [ ] Parse warnings displayed if present
- [ ] Navigation buttons work
- [ ] No TypeScript or console errors
- [ ] Does not render raw data in page \`<title>\` or meta tags

## Suggested files
- \`src/app/(app)/projects/[id]/preview/page.tsx\`
- \`src/components/preview/DataTable.tsx\`
- \`src/components/preview/ParseWarningBanner.tsx\`

## Tests required
- Unit test for \`DataTable\` with mock data (renders correct number of rows, truncates to 25)

## Dependencies
- #6 CSV parsing

## Estimated complexity
Medium (3–4 hours)" \
  '["ui","frontend"]'

# ── 8. Column type inference ─────────────────────────────────────────────────
echo "[8/23] Column type inference"
create_issue \
  "Column type inference" \
  "## Goal
Automatically infer the semantic type of each column from its values so the user has a smart default to confirm rather than starting from scratch.

## Requirements
- Pure library function: \`src/lib/infer/infer-column-types.ts\`
- Input: \`Dataset\` (headers + rows from the parser)
- Output: \`ColumnInference[]\` where each item contains \`{ header, inferredType, confidence, sampleValues }\`
- Types to detect:
  - \`rating\` — numeric values in a bounded range (e.g. 1–5, 1–10, 0–100)
  - \`nps\` — numeric 0–10 specifically
  - \`category\` — string column with low cardinality (≤ 20 unique values)
  - \`date\` — parseable date strings
  - \`open_text\` — long free-form strings (avg length > 30 chars)
  - \`numeric\` — general numeric
  - \`id\` — high-cardinality unique values
  - \`unknown\` — fallback
- Confidence score (0–1) based on percentage of non-null values matching the type
- Uses only a sample of up to 200 rows for inference speed
- No logging of cell values

## Acceptance criteria
- [ ] Correctly infers \`rating\` for a 1–5 numeric column
- [ ] Correctly infers \`nps\` for a 0–10 numeric column
- [ ] Correctly infers \`category\` for a low-cardinality string column
- [ ] Correctly infers \`open_text\` for a long-string column
- [ ] Returns \`unknown\` for unrecognized patterns
- [ ] Confidence scores are between 0 and 1
- [ ] Performance: runs in < 100 ms on 200-row sample

## Suggested files
- \`src/lib/infer/infer-column-types.ts\`
- \`src/types/column.ts\` (ColumnType enum, ColumnInference type)

## Tests required
- Unit tests for each inferred type with representative fixtures
- Edge cases: all-null column, single-value column, mixed types

## Dependencies
- #6 CSV parsing (\`Dataset\` type)

## Estimated complexity
Medium (4–6 hours)" \
  '["backend","data-pipeline"]'

# ── 9. Column mapping screen ─────────────────────────────────────────────────
echo "[9/23] Column mapping screen"
create_issue \
  "Column mapping screen" \
  "## Goal
Let users review and correct the inferred column roles before analysis, ensuring the pipeline uses the right interpretation for each column.

## Requirements
- Route: \`/projects/[id]/columns\`
- Table with one row per column: column name, sample values, inferred type (pre-selected), editable type dropdown
- Dropdown options match \`ColumnType\` enum: rating, nps, category, date, open_text, numeric, id, ignore
- Confidence score shown as a visual indicator (e.g. color or percentage)
- \"Ignore\" option removes a column from analysis
- Validation: at least one analyzable column must be selected (not all ignored)
- \"Confirm and Clean\" button submits the mapping and navigates to the cleaning step
- Column mapping stored in component state (persisted to Supabase in a later issue)

## Acceptance criteria
- [ ] Each column shows its inferred type pre-selected
- [ ] User can change any column type via dropdown
- [ ] \"Confirm\" is disabled if all columns are set to \`ignore\`
- [ ] Submitting navigates to the next step
- [ ] No TypeScript or console errors

## Suggested files
- \`src/app/(app)/projects/[id]/columns/page.tsx\`
- \`src/components/columns/ColumnMappingTable.tsx\`
- \`src/components/columns/TypeDropdown.tsx\`
- \`src/types/column.ts\`

## Tests required
- Unit tests for the \"at least one analyzable column\" validation logic

## Dependencies
- #7 Data preview screen
- #8 Column type inference

## Estimated complexity
Medium (4–5 hours)" \
  '["ui","frontend"]'

# ── 10. Schema validation ────────────────────────────────────────────────────
echo "[10/23] Schema validation"
create_issue \
  "Schema validation" \
  "## Goal
Validate the user-confirmed column mapping against the parsed dataset before allowing cleaning to proceed, catching structural issues early.

## Requirements
- Library function: \`src/lib/validate/validate-schema.ts\`
- Input: \`Dataset\` + \`ColumnMapping[]\` (user-confirmed roles)
- Checks:
  - All mapped columns exist in the dataset headers
  - No duplicate column roles that would conflict (e.g. two NPS columns)
  - Rating columns contain only numeric-parseable values (> 80% threshold)
  - Date columns contain only parseable dates (> 80% threshold)
  - NPS columns contain values in 0–10 range (> 80% threshold)
- Output: \`{ valid: boolean, errors: SchemaError[], warnings: SchemaWarning[] }\`
- Errors block progression; warnings are shown but allow continuation

## Acceptance criteria
- [ ] Returns \`{ valid: true }\` for a well-formed mapping
- [ ] Returns an error if a mapped column is missing from headers
- [ ] Returns a warning if a rating column has > 20% non-numeric values
- [ ] Does not log cell values

## Suggested files
- \`src/lib/validate/validate-schema.ts\`
- \`src/types/schema.ts\` (SchemaError, SchemaWarning)

## Tests required
- Unit tests for each validation rule with pass and fail fixtures

## Dependencies
- #6 CSV parsing
- #8 Column type inference
- #9 Column mapping screen

## Estimated complexity
Small–Medium (2–4 hours)" \
  '["backend","data-pipeline"]'

# ── 11. Data cleaning pipeline ───────────────────────────────────────────────
echo "[11/23] Data cleaning pipeline"
create_issue \
  "Data cleaning pipeline" \
  "## Goal
Transform the raw parsed dataset into a clean, analysis-ready dataset by applying type-specific cleaning rules to each column.

## Requirements
- Library module: \`src/lib/clean/clean-dataset.ts\`
- Input: \`Dataset\` + confirmed \`ColumnMapping[]\`
- Cleaning operations by type:
  - All columns: trim whitespace, normalize empty strings to \`null\`
  - Numeric / rating / nps: parse to number, set out-of-range values to \`null\`, record as anomaly
  - Date: parse to ISO 8601, set unparseable values to \`null\`, record as anomaly
  - Category: normalize case (title case), merge near-duplicates only if confidence > 90%
  - Open text: trim only — do not alter content
  - id / ignore: pass through unchanged
- Output: \`CleanResult { cleanedDataset: Dataset, anomalies: Anomaly[], rowsAffected: number, columnsAffected: number }\`
- Does NOT mutate the original dataset
- Does NOT log cell values

## Acceptance criteria
- [ ] Empty strings become \`null\`
- [ ] Out-of-range numeric values become \`null\` and are recorded as anomalies
- [ ] Unparseable dates become \`null\` and are recorded as anomalies
- [ ] Original dataset is unchanged after cleaning
- [ ] \`rowsAffected\` count is accurate

## Suggested files
- \`src/lib/clean/clean-dataset.ts\`
- \`src/lib/clean/cleaners/\` (one file per column type)
- \`src/types/clean.ts\` (CleanResult, Anomaly)

## Tests required
- Unit tests per cleaner: each type with clean input, dirty input, null input
- Integration test: full dataset through the pipeline

## Dependencies
- #6 CSV parsing
- #10 Schema validation

## Estimated complexity
Large (6–10 hours)" \
  '["backend","data-pipeline"]'

# ── 12. Cleaning summary UI ──────────────────────────────────────────────────
echo "[12/23] Cleaning summary UI"
create_issue \
  "Cleaning summary UI" \
  "## Goal
Show the user a summary of what the cleaning pipeline changed so they can understand data quality before proceeding to analysis.

## Requirements
- Route: \`/projects/[id]/cleaning\`
- Summary cards: rows processed, rows affected, columns affected, total anomalies found
- Per-column breakdown table: column name, type, anomaly count, example anomaly (one value, not the full list)
- \"View details\" expandable section per column showing anomaly types (e.g. \"12 out-of-range values set to null\")
- \"Proceed to Analysis\" button — navigates to the analysis dashboard
- \"Re-map columns\" link back to \`/projects/[id]/columns\`
- Anomaly details must not display individual row indices or full open-text content

## Acceptance criteria
- [ ] Summary cards show correct counts
- [ ] Per-column table is present
- [ ] No individual row data exposed in the UI
- [ ] Navigation buttons work
- [ ] No TypeScript or console errors

## Suggested files
- \`src/app/(app)/projects/[id]/cleaning/page.tsx\`
- \`src/components/cleaning/CleaningSummaryCard.tsx\`
- \`src/components/cleaning/AnomalyTable.tsx\`

## Tests required
- Unit test for anomaly count aggregation logic (if extracted to a lib function)

## Dependencies
- #11 Data cleaning pipeline

## Estimated complexity
Medium (3–4 hours)" \
  '["ui","frontend"]'

# ── 13. Quantitative analysis ────────────────────────────────────────────────
echo "[13/23] Quantitative analysis"
create_issue \
  "Quantitative analysis" \
  "## Goal
Compute statistical summaries for numeric, rating, NPS, category, and date columns in the cleaned dataset.

## Requirements
- Library module: \`src/lib/analyze/quantitative.ts\`
- Per-column analysis by type:
  - **Numeric / rating**: mean, median, mode, std dev, min, max, quartiles (Q1, Q3), distribution buckets (10 bins)
  - **NPS (0–10)**: promoters (9–10), passives (7–8), detractors (0–6), NPS score, response count
  - **Category**: frequency count per value, percentage per value, sorted by frequency
  - **Date**: min date, max date, response count per month (for time-series chart)
- Input: \`CleanedDataset\` + \`ColumnMapping[]\`
- Output: \`QuantitativeAnalysis\` — a map of column name → typed result object
- Pure function, no side effects, no logging of values

## Acceptance criteria
- [ ] NPS score formula is correct: ((promoters - detractors) / total) * 100
- [ ] Distribution buckets sum to total non-null row count
- [ ] Category frequencies sum to total non-null row count
- [ ] Mean and median are within floating-point tolerance of hand-calculated values
- [ ] Columns typed \`ignore\` or \`open_text\` are excluded from output

## Suggested files
- \`src/lib/analyze/quantitative.ts\`
- \`src/lib/analyze/stats.ts\` (mean, median, stddev helpers)
- \`src/types/analysis.ts\`

## Tests required
- Unit tests with numeric fixtures for each statistic
- NPS score test with known promoter/detractor split
- Category frequency test

## Dependencies
- #11 Data cleaning pipeline

## Estimated complexity
Large (6–8 hours)" \
  '["backend","data-pipeline"]'

# ── 14. Text analysis ────────────────────────────────────────────────────────
echo "[14/23] Text analysis"
create_issue \
  "Text analysis" \
  "## Goal
Perform basic text analysis on open_text columns to extract word frequencies, response length stats, and simple sentiment signals without sending data to an external API.

## Requirements
- Library module: \`src/lib/analyze/text.ts\`
- Input: string values from \`open_text\` columns in the cleaned dataset
- Operations:
  - Response count and non-empty response count
  - Average, min, max response length (characters)
  - Top 20 word frequencies (after stop-word removal and lowercasing)
  - Simple positive/negative word count ratio as a proxy sentiment score (use a small hardcoded word list — no external NLP library for MVP)
- Output: \`TextAnalysis\` per column
- Stop words: common English stop words (a hardcoded list is fine for MVP)
- Does NOT send text to any external service
- Does NOT log response content

## Acceptance criteria
- [ ] Word frequency list excludes stop words
- [ ] Word frequency is sorted descending by count
- [ ] Response length stats are correct
- [ ] Sentiment score is between -1 and 1
- [ ] Analysis runs in < 500 ms on 1,000 responses

## Suggested files
- \`src/lib/analyze/text.ts\`
- \`src/lib/analyze/stop-words.ts\`
- \`src/types/analysis.ts\`

## Tests required
- Unit tests: word frequency with known input, stop word removal, empty column, single-word responses

## Dependencies
- #11 Data cleaning pipeline

## Estimated complexity
Medium (4–6 hours)" \
  '["backend","data-pipeline"]'

# ── 15. Chart transformations ────────────────────────────────────────────────
echo "[15/23] Chart transformations"
create_issue \
  "Chart transformations" \
  "## Goal
Transform raw analysis results into chart-ready data structures that UI components can render directly, keeping chart logic out of components.

## Requirements
- Library module: \`src/lib/charts/transform-analysis.ts\`
- Input: \`QuantitativeAnalysis\` + \`TextAnalysis\`
- Output: \`ChartData\` map — one entry per column, each containing the chart type and its data payload
- Chart types to support:
  - Bar chart — category frequency, word frequency
  - Histogram — numeric/rating distribution
  - Gauge or score card — NPS score
  - Line chart — date/time-series response count
  - Summary table — text analysis stats
- Data payloads must conform to a library-agnostic format (arrays of \`{ label, value }\`) so the chart library can be swapped
- No React imports in this module

## Acceptance criteria
- [ ] NPS column produces a gauge-type chart data object
- [ ] Category column produces a bar chart data object
- [ ] Numeric/rating column produces a histogram data object
- [ ] Date column produces a line chart data object
- [ ] All outputs are serializable (no functions or class instances)

## Suggested files
- \`src/lib/charts/transform-analysis.ts\`
- \`src/types/charts.ts\` (ChartData, ChartEntry types)

## Tests required
- Unit tests for each chart type transformation with snapshot or explicit assertions

## Dependencies
- #13 Quantitative analysis
- #14 Text analysis

## Estimated complexity
Medium (3–5 hours)" \
  '["backend","data-pipeline"]'

# ── 16. Analysis dashboard ───────────────────────────────────────────────────
echo "[16/23] Analysis dashboard"
create_issue \
  "Analysis dashboard" \
  "## Goal
Render the per-project analysis dashboard displaying all charts derived from the cleaned dataset, one section per analyzed column.

## Requirements
- Route: \`/projects/[id]/dashboard\`
- One chart card per column in the \`ChartData\` map
- Chart library: choose one lightweight option (e.g. Recharts or Chart.js via react-chartjs-2); justify the choice in the PR
- Supported chart renders: bar, histogram, line, gauge/scorecard, summary table
- Each card shows: column name, column type badge, the chart
- Dashboard header: project name, dataset row count, date analyzed
- Responsive grid layout (1 column on mobile, 2–3 on desktop)
- Export buttons (PDF, CSV) shown but can be stubs linked to later issues

## Acceptance criteria
- [ ] Dashboard renders one card per analyzed column
- [ ] Each chart type renders without errors
- [ ] Responsive on mobile and desktop
- [ ] No raw cell data rendered in the DOM
- [ ] No TypeScript or console errors

## Suggested files
- \`src/app/(app)/projects/[id]/dashboard/page.tsx\`
- \`src/components/dashboard/ChartCard.tsx\`
- \`src/components/dashboard/charts/\` (BarChart, Histogram, LineChart, NpsGauge, SummaryTable)

## Tests required
- Unit tests for any chart data–rendering helper logic (not the chart library itself)

## Dependencies
- #15 Chart transformations
- #3 Dashboard shell

## Estimated complexity
Large (6–10 hours)" \
  '["ui","frontend"]'

# ── 17. Insight generation ───────────────────────────────────────────────────
echo "[17/23] Insight generation"
create_issue \
  "Insight generation" \
  "## Goal
Generate a short list of plain-English insights from the analysis results using rule-based logic (no AI API for MVP), displayed prominently on the dashboard.

## Requirements
- Library module: \`src/lib/insights/generate-insights.ts\`
- Input: \`QuantitativeAnalysis\` + \`TextAnalysis\` + \`ColumnMapping[]\`
- Output: \`Insight[]\` where each insight has \`{ type, title, body, severity }\`
- Rule examples:
  - NPS score < 0 → \"Negative NPS detected\" (high severity)
  - NPS score 0–30 → \"NPS needs attention\" (medium)
  - Rating column mean < 3 (out of 5) → \"Low average rating on [column]\"
  - Category column where top value > 60% of responses → \"[Value] dominates [column]\"
  - Text column with > 50% empty responses → \"Low response rate on [column]\"
  - Any column with > 20% null values after cleaning → \"Data quality issue on [column]\"
- Maximum 10 insights rendered (sorted by severity desc)
- Insights panel shown above charts on the dashboard
- No cell values included in insight body text

## Acceptance criteria
- [ ] NPS < 0 triggers the negative NPS insight
- [ ] No insight body contains raw cell values
- [ ] At most 10 insights rendered
- [ ] Severity ordering is respected

## Suggested files
- \`src/lib/insights/generate-insights.ts\`
- \`src/lib/insights/rules/\` (one file per rule group)
- \`src/components/dashboard/InsightsPanel.tsx\`
- \`src/types/insights.ts\`

## Tests required
- Unit tests for each insight rule with pass/fail fixtures

## Dependencies
- #13 Quantitative analysis
- #14 Text analysis

## Estimated complexity
Medium (4–6 hours)" \
  '["backend","data-pipeline","ui"]'

# ── 18. Cleaned CSV export ───────────────────────────────────────────────────
echo "[18/23] Cleaned CSV export"
create_issue \
  "Cleaned CSV export" \
  "## Goal
Allow users to download the cleaned dataset as a CSV file directly from the dashboard.

## Requirements
- Route Handler: \`GET /api/projects/[id]/export/csv\`
- Serializes the \`CleanedDataset\` to CSV format (same delimiter as the original, defaulting to comma)
- Streams the response — does not buffer the entire CSV in memory
- Sets correct headers: \`Content-Type: text/csv\`, \`Content-Disposition: attachment; filename=\"cleaned_[original_name].csv\"\`
- Includes a header row
- Null values are written as empty strings
- Download triggered from a button on the dashboard
- Sanitize filename to prevent header injection (\`Content-Disposition\` header)

## Acceptance criteria
- [ ] Downloaded file opens correctly in Excel / Google Sheets
- [ ] Header row matches column names
- [ ] Null values are empty cells, not the string \"null\"
- [ ] Filename is sanitized (no newlines or semicolons)
- [ ] Response is streamed (no full-buffer in memory for large files)

## Suggested files
- \`src/app/api/projects/[id]/export/csv/route.ts\`
- \`src/lib/export/serialize-csv.ts\`

## Tests required
- Unit tests for \`serialize-csv.ts\`: header row, null handling, delimiter, filename sanitization

## Dependencies
- #11 Data cleaning pipeline
- #16 Analysis dashboard (download button)

## Estimated complexity
Small–Medium (2–4 hours)" \
  '["backend","export"]'

# ── 19. Report export ────────────────────────────────────────────────────────
echo "[19/23] Report export"
create_issue \
  "Report export" \
  "## Goal
Allow users to download a PDF report summarizing the project: dataset overview, insights, and one chart image per analyzed column.

## Requirements
- Route Handler: \`GET /api/projects/[id]/export/report\`
- PDF generated server-side using a library (e.g. \`@react-pdf/renderer\` or \`puppeteer\`; justify choice in PR)
- Report sections:
  1. Cover: project name, date, dataset row/column counts
  2. Insights summary (from #17)
  3. Per-column section: column name, type, key stats, chart image (PNG snapshot)
- Charts are rendered to PNG on the server using a headless approach or a server-side charting library
- PDF is streamed as a download
- Report does NOT include raw open-text responses — only aggregates
- Sanitize all user-provided strings inserted into the PDF

## Acceptance criteria
- [ ] PDF downloads and opens without corruption
- [ ] All sections are present
- [ ] No raw open-text content in the PDF
- [ ] User-provided strings are not interpreted as HTML or PDF commands

## Suggested files
- \`src/app/api/projects/[id]/export/report/route.ts\`
- \`src/lib/export/generate-report.ts\`
- \`src/lib/export/report-template.tsx\` (if using react-pdf)

## Tests required
- Unit test for report data assembly (not PDF rendering itself)

## Dependencies
- #13 Quantitative analysis
- #14 Text analysis
- #17 Insight generation
- #18 Cleaned CSV export (establishes the export API pattern)

## Estimated complexity
Large (8–12 hours)" \
  '["backend","export"]'

# ── 20. Supabase persistence ─────────────────────────────────────────────────
echo "[20/23] Supabase persistence"
create_issue \
  "Supabase persistence" \
  "## Goal
Persist project data to Supabase so analysis results survive page refresh and users can return to past projects.

## Requirements
- Configure Supabase client: \`src/lib/db/supabase.ts\` (server) and \`src/lib/db/supabase-browser.ts\` (client)
- Database schema (migrations in \`supabase/migrations/\`):
  - \`projects\` table: id, user_id, name, created_at, status
  - \`datasets\` table: id, project_id, original_filename, row_count, column_count, created_at
  - \`column_mappings\` table: id, dataset_id, column_name, column_type, confirmed_at
  - \`analysis_results\` table: id, dataset_id, result_json (JSONB), created_at
- Row-level security (RLS) enabled on all tables: users can only read/write their own rows
- Server Actions or Route Handlers for: create project, save column mapping, save analysis results, list projects
- No raw cell data stored in the database (only aggregates and metadata)
- Environment variables: \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`, \`SUPABASE_SERVICE_ROLE_KEY\` (service key server-only)

## Acceptance criteria
- [ ] RLS enabled and tested: a user cannot read another user's projects via the API
- [ ] Analysis results persist across page refresh
- [ ] Project list page shows past projects
- [ ] Raw uploaded data is not stored in the database
- [ ] Service role key is never exposed to the client

## Suggested files
- \`src/lib/db/supabase.ts\`
- \`src/lib/db/supabase-browser.ts\`
- \`src/lib/db/projects.ts\` (CRUD helpers)
- \`supabase/migrations/001_initial.sql\`

## Tests required
- Unit tests for DB helper functions using a mock Supabase client
- Manual test: verify RLS blocks cross-user access in Supabase dashboard

## Dependencies
- #1 Base project structure
- #11 Data cleaning pipeline
- #13 Quantitative analysis

## Estimated complexity
Large (8–12 hours)" \
  '["backend","database","infrastructure"]'

# ── 21. Authentication ───────────────────────────────────────────────────────
echo "[21/23] Authentication"
create_issue \
  "Authentication" \
  "## Goal
Add user authentication via Supabase Auth so analysis projects are private and associated with a specific user account.

## Requirements
- Use Supabase Auth (email + password for MVP; magic link optional)
- Sign-up and sign-in pages: \`/auth/sign-up\`, \`/auth/sign-in\`
- Auth state managed via Supabase SSR helpers (\`@supabase/ssr\`)
- Middleware (\`src/middleware.ts\`) protects all \`/projects/*\` and \`/upload\` routes — unauthenticated requests redirect to \`/auth/sign-in\`
- Session refresh handled in middleware
- Sign-out button in the nav
- Redirect to \`/upload\` after successful sign-in
- Error messages for invalid credentials (generic — do not confirm whether email exists)
- All auth tokens stored in httpOnly cookies via Supabase SSR (not localStorage)

## Acceptance criteria
- [ ] Unauthenticated user visiting \`/upload\` is redirected to sign-in
- [ ] Signed-in user can access their projects
- [ ] Signed-out user cannot access \`/projects/*\` routes
- [ ] Session persists across page refresh
- [ ] Auth token is in an httpOnly cookie, not localStorage
- [ ] Invalid credentials show a generic error (not \"email not found\")

## Suggested files
- \`src/middleware.ts\`
- \`src/app/(auth)/sign-in/page.tsx\`
- \`src/app/(auth)/sign-up/page.tsx\`
- \`src/lib/auth/get-session.ts\`

## Tests required
- Unit test for middleware redirect logic (mock request/response)

## Dependencies
- #20 Supabase persistence

## Estimated complexity
Medium (4–6 hours)" \
  '["backend","auth","security"]'

# ── 22. Security and privacy audit ──────────────────────────────────────────
echo "[22/23] Security and privacy audit"
create_issue \
  "Security and privacy audit" \
  "## Goal
Review the full codebase for security and privacy risks before production deployment, addressing any findings.

## Requirements
Review each area and document findings; fix all high-priority issues before closing this issue:

**File upload security**
- [ ] MIME type validation cannot be spoofed by filename alone (check actual bytes / content-type header)
- [ ] File size enforced server-side, not just client-side
- [ ] Uploaded files are not stored permanently on disk or in a publicly accessible location
- [ ] No path traversal possible in filename handling

**Data privacy**
- [ ] No raw uploaded rows logged at any log level (server or client)
- [ ] Open-text responses not sent to external APIs without explicit feature flag
- [ ] Analysis results stored in DB contain only aggregates
- [ ] Report PDF contains no raw open-text responses

**Authentication and authorization**
- [ ] All \`/projects/*\` routes are protected by middleware
- [ ] RLS prevents cross-user data access at the DB layer
- [ ] Service role key is only used server-side
- [ ] No auth tokens in localStorage or cookies without httpOnly flag

**API security**
- [ ] All Route Handlers validate the authenticated session before processing
- [ ] No SQL injection vectors (using Supabase parameterized queries)
- [ ] \`Content-Disposition\` header filenames are sanitized
- [ ] No secrets in client bundles (check with \`NEXT_PUBLIC_\` prefix audit)

**Dependency audit**
- [ ] \`npm audit\` shows no high/critical vulnerabilities
- [ ] No unnecessarily large or unmaintained packages

## Acceptance criteria
- [ ] All high-priority findings fixed before this issue is closed
- [ ] Medium-priority findings documented as follow-up issues
- [ ] \`npm audit\` shows 0 high/critical

## Suggested files
- All Route Handlers (\`src/app/api/**\`)
- \`src/middleware.ts\`
- \`src/lib/upload/\`
- \`src/lib/db/\`
- \`src/lib/export/\`

## Tests required
- Add any missing tests surfaced during the audit

## Dependencies
- #21 Authentication (must be complete before auditing)
- All data pipeline issues (#5–#19)

## Estimated complexity
Large (8–12 hours)" \
  '["security","privacy"]'

# ── 23. Deployment ───────────────────────────────────────────────────────────
echo "[23/23] Deployment"
create_issue \
  "Deployment" \
  "## Goal
Deploy the production build to Vercel (or equivalent), configure environment variables, and validate the full user workflow end-to-end in production.

## Requirements
- Deploy target: Vercel (recommended for Next.js App Router)
- Environment variables configured in Vercel dashboard (not committed):
  - \`SUPABASE_URL\`
  - \`SUPABASE_ANON_KEY\`
  - \`SUPABASE_SERVICE_ROLE_KEY\` (server-only)
  - Any future AI API keys
- Production Supabase project created (separate from dev)
- Custom domain configured (optional for initial deploy)
- CI pipeline (\`.github/workflows/ci.yml\`) passes on \`main\` before deploy
- Vercel preview deployments enabled for pull requests
- \`next.config.ts\` reviewed for production settings (no \`ignoreBuildErrors\`, no \`ignoreDuringBuilds\`)
- \`npm run build\` passes locally before deploy
- Post-deploy smoke test: upload a sample CSV, run through full workflow, download report

## Acceptance criteria
- [ ] Production URL is live and loads without errors
- [ ] Full MVP workflow completes end-to-end in production
- [ ] Environment variables are set and not exposed in client bundles
- [ ] CI passes on \`main\`
- [ ] Vercel preview deploys work on PRs
- [ ] \`npm audit\` shows 0 high/critical (re-verify post-deploy)

## Suggested files
- \`next.config.ts\`
- \`.github/workflows/ci.yml\` (add deploy step if using Vercel GitHub integration)
- \`vercel.json\` (if custom config needed)

## Tests required
- Manual smoke test against production URL

## Dependencies
- #22 Security and privacy audit (must pass before production)
- All other issues

## Estimated complexity
Medium (3–5 hours)" \
  '["infrastructure","deployment"]'

echo ""
echo "Done. All 23 issues submitted to https://github.com/${REPO}/issues"
