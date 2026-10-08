# Decisions

For each: **what I chose, what I rejected and why, what would make me flip it.**

## 1. Conventions are enforced by lint and fixtures, not described in a document

**Chose:** `eslint.config.mjs` turns the project rules into errors: tests cannot import `@playwright/test` directly, cannot use raw locators, sleeps, `force`, `test.only` or `test.skip`; page objects cannot contain `expect()`. `npm run verify` (typecheck + lint + tests) is the single gate. The README has the rule table, but the lint is what makes it real.

**Rejected:** a long contributing guide, or a separate agent-instructions file. An AI agent reads instructions once and then drifts; a human reviewer catches the drift days later. A lint error is immediate, specific and the same feedback loop an agent already understands: make the command green. I also kept to one document (README) so there is one place to read, for people and for agents.

**Would flip it:** a small, stable team of humans who already share these habits. Then the strict rules cost more friction than they save, and a recommended-only lint config would do. And if the team used Claude Code daily, I would add a one-line `CLAUDE.md` that says "read README.md", because that file is picked up automatically.

## 2. The folder structure is a decision I own, because Playwright has no "Maven"

**Chose:** a standard layered layout, written down here and enforced by lint rather than left to convention: `src/{config,types,api,data,fixtures,pages,utils}` and `tests/{ui/<feature>,api}`. One class per file. Fixtures split by concern and merged in `fixtures/index.ts`. API client split per domain behind one `Api` object. Data split into `factories/` (dynamic), `static/` (table-driven JSON) and `products.ts` (live). The header is a component composed into `BasePage`, not inherited.

**Rejected:** waiting for or copying a "standard" boilerplate. In Java, Maven fixed the folders and TestNG + Selenium + Cucumber + Extent + PageFactory each added a layer; the structure fell out of the glue. Playwright ships runner, assertions, fixtures and reports as one package, so no glue convention emerged: `npm init playwright` creates `tests/` and a config, nothing else, and no community boilerplate is canonical. Also rejected: the first version of this repo, 13 files with everything collapsed (`api.ts`, `data.ts`, `fixtures.ts`, two page classes per file). Easier to read in one sitting while learning Playwright, but at 50 endpoints `api.ts` is 800 lines and every new fixture edits one monolith. Also rejected a separate `locators/` layer (the Selenium habit): a `Locator` is lazy and auto-waits, so splitting "find" from "act" puts one idea in two files for no gain. Also rejected `flows/` (multi-page business steps) for now, no sequence repeats across 3+ tests yet, and `playwright-bdd` (Cucumber on Playwright): nobody here reads Gherkin, so it would be cost without a reader.

**Would flip it:** a throwaway project with under ~15 tests and one maintainer, where the flat version is honestly better. Or a product team that reads scenarios, where `playwright-bdd` goes on top of these same pages and fixtures with `.feature` files replacing `tests/`. The restructure is recorded in AI_USAGE #5 so the before/after is visible.

## 3. Fixtures own test data and cleanup; nothing is hardcoded and nothing is left behind

**Chose:** `registeredUser` creates a unique account through the API before the test and deletes it after, pass or fail. `cleanup.track()` lets a test that signs up through the UI register that account for the same teardown. `loggedInPage` builds on `registeredUser`: that is the shared-auth pattern. Products are never hardcoded: `pickProducts(api, n)` reads the live catalogue, the search tests compare UI results with the search API for the same term, and the checkout test computes the expected total from API prices. Table-driven inputs live in `src/data/static/*.json` and are looped in the spec. The same fixture layer also blocks ad and analytics hosts at the network level, so no test contains "close the ad if it appears" logic.

**Rejected:** `beforeEach` / `afterEach` blocks inside each spec. They get copy-pasted and forgotten, and an agent adding a test has no signal that cleanup is required. Rejected one pre-created account reused by every test with saved `storageState`: faster, but the checkout test mutates server state (cart, orders) and parallel workers would collide on the same cart. Rejected hardcoding "Blue Top / Rs. 500": easier to read, but the first catalogue change breaks every test for a reason unrelated to the product, and an agent "fixing" it would paste in new magic values.

**Would flip it:** login that is expensive (SSO, MFA, more than ~10 s) combined with read-only tests, then one account per worker with saved `storageState` is the better trade. And a product with a seeded, version-controlled test database, then fixed fixtures are clearer than live lookups.

## 4. The API client returns the JSON body, and tests assert on `responseCode` inside it

**Chose:** every method in `src/api/*.api.ts` returns the parsed body; tests check `body.responseCode` and `body.message`.

**Rejected:** asserting on the HTTP status. This site returns HTTP 200 for almost everything, including "400 Bad request" and "404 User not found", and puts the real code in the JSON. Tests on the HTTP status would pass while the API is rejecting the request.

**Would flip it:** an API that uses real HTTP status codes. Then the client would check `res.ok()` centrally and return typed bodies only.

## Not built, and how I would add it

- **CI/CD (out of scope):** one GitHub Actions workflow running `npm run verify` on every pull request, uploading `playwright-report/` as an artifact, with `RETRIES=1` in CI only and the flaky count tracked as a metric. A nightly run against the live site.
- **Multi-browser:** add `firefox` and `webkit` projects in `playwright.config.ts`. The locators are role- and `data-qa`-based, so they are browser-agnostic already.
