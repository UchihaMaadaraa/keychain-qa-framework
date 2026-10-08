# AI usage

A factual log of how AI was used to build this repo: what I asked for, what it produced, where it was
wrong, and what I changed. Tool: **Claude** (Claude Code, model Fable 5.x) for the whole project.

---

## 1. Design: translating my own framework into Playwright

**What I asked (paraphrased from a longer conversation):**
> "Make an automation framework that feels like me. Start from this: driver in a base class, a driver factory
> with an init method that sends capabilities and returns a driver; page classes that take the driver in the
> constructor and hold locators plus one method per action; step definitions glued to feature files via a
> TestNG-Cucumber runner; XMLs that start Extent reports; ThreadLocal driver and a parallel DataProvider;
> a `Platform.Destination` parameter (e.g. Android.Remote, Web.Local) read from XML with System.getProperty fallback."

**Response (summary):** Claude mapped each layer to a Playwright equivalent and explained the lifecycle
difference: ThreadLocal driver → worker isolation + per-test `page`/`context` fixtures; TestNG XML parameters
→ `env` with CLI override; `ITestListener` + Extent → built-in reporters, `test.step`, traces; `IRetryAnalyzer`
→ `retries` with the *flaky* outcome; Cucumber glue → plain `test()` with `test.step` (my call, see DECISIONS.md).

**Correction I made:** the first draft of the config kept my old precedence (XML value wins over the CLI).
I changed it to CLI > env > default so CI can override anything per run.

---

## 2. The framework's own lint caught the AI's code

**What happened:** Claude generated the spec files and the ESLint config in the same session, then ran
`npm run lint`. The AI's own tests failed the AI's own rules with 7 errors:

```
tests/ui/checkout.spec.ts          22:5  error  Avoid having conditionals in tests   playwright/no-conditional-in-test
tests/ui/product-discovery.spec.ts 37:5  error  Avoid having conditionals in tests   playwright/no-conditional-in-test
tests/ui/product-discovery.spec.ts 43:18 error  Usage of raw locator detected        playwright/no-raw-locators
tests/api/products.api.spec.ts     4:8   error  valid-title (my own regex rejected "/api/" in titles)
```

**Fix (not a rule disable):** the `if (!product) throw` guards moved into `pickProducts()` (now in
`src/data/products.ts`), the raw `.locator('.productinfo h2')` became `ProductsPage.priceOf(name)`, and the
over-strict `valid-title` pattern was removed because it blocked legitimate titles.

**Why it matters for "agentic-first":** this is the mechanism working as designed. The agent drifted from the
layer rules within minutes of writing them; the gate caught it before a human had to.

---

## 3. Selectors came from the live DOM, not from the model's memory

**What happened:** instead of letting the AI guess locators, I had it inspect automationexercise.com through my
browser (Claude in Chrome) and dump the real attributes. Findings that shaped the page objects: the site
uses `data-qa="..."` on every form field and button (login, signup, payment); product cards have a hover
overlay whose "Add to cart" is the clickable one; cart rows are `tr#product-<id>` with `.cart_price`,
`.cart_quantity button`, `.cart_total_price`.

**Mistake caught (first real run, 6 Oct 2026, `npm run test:api`, 5 passed / 1 failed):**
The AI wrote `expect(new Set(names).size).toBe(names.length)` for `GET /api/brandsList`, assuming the
endpoint returns a de-duplicated list of brands. It does not: the real response has 34 rows and only
8 distinct brand names (one row per product-brand pair). The trace in `test-results/` showed
`Expected: 34, Received: 8`.

Before (wrong assumption encoded as an assertion):
```ts
const names = result.brands.map((b) => b.brand);
expect(new Set(names).size).toBe(names.length);
```
After (assert what the data actually guarantees, and cross-check it against another endpoint):
```ts
const brandNames = new Set(brands.brands.map((b) => b.brand));
const catalogueBrands = new Set(catalogue.products.map((p) => p.brand));
expect([...brandNames].sort()).toEqual([...catalogueBrands].sort());
```
I rejected the AI's implicit model of the endpoint rather than loosening the test, and replaced a
uniqueness check with a consistency check between `/api/brandsList` and `/api/productsList`.

---

## 4. First browser run: 4 of 6 UI tests failed, all four were wrong assumptions in the code

**What happened (7 Oct 2026, `npm run test:ui`, 2 passed / 4 failed, 1.3 min):** typecheck, lint and the
API suite were already green. The browser run exposed four assumptions the AI had encoded without
checking them against the site. For each: the decisive line from the report, the real cause, the change.

| Test | Report said | Real cause | Change |
|---|---|---|---|
| checkout: order total | `Expected: "Rs. 0.9"  Received: "Rs. 900"` | `rupees()` stripped `[^\d.]`, so `"Rs. 500"` became `".500"` = 0.5. The site was right, the helper was wrong. | `rupees()` now strips `\D` (prices are whole rupees) |
| product discovery: UI search vs API | `"Little Girls Mr. Panda Shirt" should contain "top"` | The site searches description/category too, not only the name. Checked `POST /api/searchProduct` with `top`: 14 results, 2 without "top" in the name. | Removed the "every name contains the term" step. Kept the real property: UI result set equals API result set for the same term. |
| signup: new user | `waiting for getByRole('radio', { name: 'Mr', exact: true })` (60 s timeout) | Accessibility snapshot shows `radio "Mr."` with a dot; the `value` attribute is `Mr`. `exact: true` on the label never matched. | `SignupPage` selects the radio by `value`, which is what `TestUser.title` holds |
| signup: duplicate email | `Expected pattern: /\/login$/  Received: ".../signup"` | The site re-renders the login page under the `/signup` URL after a rejected signup. | Dropped the URL assertion. Now asserts the outcome: error text shown, nobody logged in, signup form still visible. |

**Pattern:** none of the four fixes touched the site or weakened a check. One was a pure bug (the regex),
three were assertions about how the app *should* behave rather than how it *does*. The two that passed
were the ones backed by the live DOM inspection in section 3 (`data-qa` locators, price card).

**Why it matters for "agentic-first":** the agent cannot know these without running against the real
site. The framework's job is to make that feedback fast and unambiguous: one command, trace and
`error-context.md` per failure, the decisive line in the first screen of output.

---

## 5. Restructure to a standard layered layout, 13 files to 28

**What I asked (7 Oct 2026, paraphrased):**
> "Why is data in a `.ts` file, should it not be a data provider? Assume this framework has to scale and
> be maintained by a team. Is there a standard Playwright framework structure, like Maven + design
> patterns define one for Java Selenium?"

**Where the AI did not do what I meant:** its first answer defended the single `data.ts` as already being
the DataProvider and argued a static data file was unnecessary. Technically right, wrong frame. I was not
asking whether the code works; I was asking what a scalable layout looks like. Once I said so, it switched.

**Response (summary):** no Maven equivalent exists; `npm init playwright` scaffolds `tests/` and a config
only. The AI laid out the de facto community layout (config / types / api per domain / data split into
factories, static, live / fixtures per concern / pages per feature with components / utils) and the
Java mapping for each. I asked whether my own layering (runner, pages, implemented methods, page
methods, locator class, data provider, resources) was standard. Answer: same except two points. The
separate locator class merges into the page (a `Locator` is lazy, no reason to split find from act),
and the "implemented methods" layer (`flows/`) is added only when a multi-page sequence repeats.

**Change:** the first version of this repo was 13 files with everything collapsed: one `api.ts`, one
`data.ts`, one `fixtures.ts`, two page classes per file. Right for learning Playwright, wrong for growth.
Concretely: `api.ts` became `api/{client,products.api,accounts.api,index}.ts` so tests call
`api.products.list()`; `data.ts` became `data/factories/user.factory.ts`, `data/products.ts`,
`data/static/search-terms.json` and `utils/money.ts`; `fixtures.ts` became four `*.fixture.ts` chained
and merged in `fixtures/index.ts`; page files split one class each into `auth/`, `shop/`, `checkout/`
with the header pulled into `components/`; shared types moved to `types/index.ts`; env reading moved
to `config/env.ts` with `.env.example`. One table-driven test was added (search terms from JSON, a
`for` loop in the spec) so both DataProvider patterns are live. Lint and fixture rules unchanged.
Recorded in DECISIONS #2.

**Run:** `npm run verify` after the restructure: typecheck ok, lint ok, 14 passed (36.9 s). Zero test
logic changed; the two extra tests are the new JSON rows.

---

## 6. Run log

| Date | Command | Result | Notes |
|---|---|---|---|
| 6 Oct 2026 | `npm run test:api` | 5 passed, 1 failed | brandsList uniqueness assumption, see section 3; fixed |
| 7 Oct 2026 | `npm run test:api` | 6 passed (6.3 s) | after the brandsList fix |
| 7 Oct 2026 | `npm run test:ui` | 2 passed, 4 failed (1.3 min) | first browser run, see section 4 |
| 7 Oct 2026 | `npm run verify` | typecheck ok, lint ok, 12 passed (36.7 s) | after the four fixes; 2 workers, headless |
| 7 Oct 2026 | `npm run verify` | typecheck ok, lint ok, 14 passed (36.9 s) | after the restructure (section 5); +2 table-driven rows |
| 8 Oct 2026 | `npm run verify` | typecheck ok, lint ok, 14 passed (33.2 s) | final run by me on my machine |

---

## 7. Timeline: what I asked, where the AI drifted, what I corrected

The sections above are organised by topic. This is the same history in order.

| I asked | AI did | I corrected |
|---|---|---|
| "Make a framework that feels like me" (my Java layers listed) | Kept my old precedence: XML value wins over CLI | Flipped to CLI > env > default so CI can override anything (section 1) |
| Generate the specs and the lint config | Its own tests broke its own lint, 7 errors | Moved guards into `pickProducts()`, raw locator into a page method. No rule disabled (section 2) |
| Write the API tests | Assumed `brandsList` is de-duplicated; it is 34 rows, 8 brands | Replaced the uniqueness check with a consistency check against `productsList` (section 3) |
| Run the full gate | API 6/6, UI 2/6. Four assumptions never checked against the site: the `rupees()` regex, "search matches the name", the `Mr` vs `Mr.` radio label, the `/login` redirect after a rejected signup | Fixed all four without weakening an assertion (section 4). 12/12 |
| "Walk me through the structure, I come from Maven, Selenium, TestNG" | Layer-by-layer mapping | No disagreement |
| "Why is data in a `.ts` file? It should be a data provider." | Defended the flat `data.ts`; answered the wrong question | Reframed: scale and maintainability, not whether it works |
| "Is there a predefined Playwright framework, like Maven defines structure for Java?" | No. Runner, assertions, fixtures and reports are one package, so no glue convention emerged | Structure is a decision I own. DECISIONS #2 |
| "Go ahead. But is my layering standard or my own hybrid?" | Hybrid in exactly one spot: the separate locator class | Restructured 13 to 28 files, 14/14 on the first run, lint and test logic untouched (section 5) |

**The arc:** I started with a Java mental model and translated it layer by layer. The AI drifted on config
precedence, on its own lint rules, on one API assumption and on four UI assumptions. None of those were
caught by reading the code; all were caught by the gate or by running against the real site. The first
real browser run exposed four assumption bugs and zero site bugs. Then I asked what a scalable layout
looks like, learned there is no Maven equivalent, so the structure is mine to decide and document.
Restructured with the same lint and the same tests, and the gate stayed green. Every reversal is in
DECISIONS with a "would flip it" clause.

The pattern across all of it: the AI is confident and the site is indifferent. The gate plus a real run
beat review every time. That is the whole argument for building the framework agentic-first.

---

## Working agreement I used with the AI

- The AI writes, the gate decides. Runs were executed on my machine, by me or by the agent at my request;
  every result in the run log is from a real run against automationexercise.com.
- No assertion was weakened and no rule disabled to make a run pass.
- The AI was not allowed to create accounts on the site during exploration; it only read pages.
