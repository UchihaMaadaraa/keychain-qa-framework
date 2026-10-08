# keychain-qa-framework

Playwright + TypeScript tests for [automationexercise.com](https://automationexercise.com), built as an exercise in an agentic-first test framework.

- UI and API tests for **signup, product discovery and checkout**, sharing one API client, one user factory and one set of fixtures.
- **Agentic-first:** the conventions are enforced by lint and fixtures, not just described, so a human or an AI coding agent gets a red `npm run verify` the moment they break one. See [Rules](#rules-for-humans-and-ai-agents).
- Why things are the way they are: [DECISIONS.md](DECISIONS.md). How AI was used, including where it was wrong: [AI_USAGE.md](AI_USAGE.md).

## Run it

Needs Node.js 20+ and internet access to automationexercise.com. No accounts or credentials: every test creates its own throwaway user and deletes it afterwards.

```bash
git clone https://github.com/UchihaMaadaraa/keychain-qa-framework.git
cd keychain-qa-framework
npm ci
npx playwright install chromium   # one-time browser download

npm test                           # everything: 14 tests, 2 in parallel, headless
```

| Command | What it does |
|---|---|
| `npm run test:api` | API tests only, no browser (fastest) |
| `npm run test:ui` | browser tests only |
| `npm run test:headed` | browser tests with the browser visible, one at a time |
| `npm run verify` | typecheck + lint + all tests. Run before every commit. |
| `npm run report` | open the last HTML report: steps, screenshots and a trace for every failure |
| `npx playwright test --ui` | Playwright's UI mode: click a test, watch each step with a DOM snapshot. Best way to learn the code. |
| `npx playwright test tests/ui/checkout` | one folder or file |

Settings are environment variables, listed in `.env.example` and read in `src/config/env.ts`: `BASE_URL`, `WORKERS` (default 2), `RETRIES` (default 0, max 2), `HEADLESS` (`false` to watch). Example: `WORKERS=4 HEADLESS=false npm test`. Playwright's own flags (`--workers`, `--retries`, `--headed`) win over them.

## The files

Layered top-down. A test talks to fixtures and pages; pages talk to the browser; the API client talks to HTTP; data and config feed both. Nothing reaches "up".

```
playwright.config.ts            runner: projects "ui" and "api", workers, retries, reporters   (testng.xml)
.env.example                    every setting, documented                                      (config.properties)
eslint.config.mjs               the rules below, as lint errors                                (checkstyle)
.mcp.json                       lets an AI agent open the real site to find locators before writing a test

src/                                                                                           (src/main/java)
  config/env.ts                 reads env vars once, typed, with defaults
  types/index.ts                TestUser, Product, ApiBody...: one definition shared by every layer
  api/                          REST client, one file per domain                               (RestAssured helpers)
    client.ts                     base: holds `request`, parses JSON or fails readably
    products.api.ts  accounts.api.ts
    index.ts                      Api = { products, accounts }   ->   api.products.list()
  data/                         test data                                                      (DataProvider)
    factories/user.factory.ts     buildUser(): unique user per call, safe in parallel
    static/search-terms.json      table-driven rows, looped in a spec
    products.ts                   pickProducts(): reads the live catalogue
  utils/money.ts                rupees("Rs. 500") -> 500
  pages/                        page objects: locators + actions in one class, no expect()
    base.page.ts                  goto(), qa(), header
    components/header.component.ts  the site header, composed into every page
    auth/login.page.ts  auth/signup.page.ts
    shop/products.page.ts  shop/cart.page.ts
    checkout/checkout.page.ts  checkout/payment.page.ts
  fixtures/                     what a test can ask for, one file per concern            (@Before/@After + DI)
    network.fixture.ts            blocks ad hosts
    api.fixture.ts                api
    user.fixture.ts               user, cleanup, registeredUser
    auth.fixture.ts               loggedInPage
    index.ts                      merges them; every test imports { test, expect } from here

tests/                                                                                         (src/test/java)
  ui/auth/  ui/shop/  ui/checkout/   one folder per feature
  api/products.api.spec.ts  api/accounts.api.spec.ts
```

**Adding things:** new endpoint = method in the matching `*.api.ts`. New domain = new `*.api.ts` + one line in `api/index.ts`. New page = new file in its feature folder. New fixture = new `*.fixture.ts`, chained or merged in `fixtures/index.ts`. New table-driven test = JSON in `data/static/` + a `for` loop in the spec.

## How one test runs

Take `tests/ui/checkout/checkout.spec.ts`. Its signature is `async ({ loggedInPage, registeredUser, api })`. Those names are **fixtures**: Playwright reads them and builds each one before the test, in dependency order, then tears them down after.

```
npm test
 → playwright.config.ts       reads env vars, picks project "ui"
 → tests/ui/checkout/checkout.spec.ts  asks for { loggedInPage, registeredUser, api }
 → src/fixtures/  (network → api → user → auth)
     context         blocks ad hosts for the whole test
     api             new Api(request)
     user            buildUser()                         data only
     cleanup         remembers accounts to delete
     registeredUser  api.accounts.create(user); cleanup.track(user)
     loggedInPage    LoginPage.goto() + loginAs(registeredUser)
 → the test body runs: page objects → locators → browser
 → teardown in reverse: cleanup.run() → api.accounts.delete(...)
 → report written to playwright-report/
```

Inside a fixture, code before `await use(x)` is setup and code after it is teardown. Teardown runs even when the test fails.

## Coming from Selenium / TestNG

| Selenium + TestNG | Here |
|---|---|
| `driver` created in a factory, stored in a ThreadLocal | Playwright gives every test its own `page`. Each worker is a separate process, so nothing is shared. |
| `WebDriverWait` / `ExpectedConditions` | None. A `Locator` waits for the element automatically before every action, and `await expect(locator).toBeVisible()` keeps retrying until the expect timeout. |
| `By.id(...)`, `By.cssSelector(...)` | `page.getByRole(...)`, `page.getByText(...)`, `page.locator('[data-qa=...]')` |
| `@BeforeMethod` / `@AfterMethod` | a fixture in `src/fixtures/` |
| `testng.xml` + `config.properties` | `playwright.config.ts` + `src/config/env.ts` + `.env.example` |
| Extent report + listener | built-in HTML report, trace and screenshot on failure, no code needed |
| RetryAnalyzer | `RETRIES` env var; a pass-on-retry is reported as flaky |
| RestAssured | `request` fixture, wrapped in `src/api/` |
| `@DataProvider` | `src/data/factories/` for dynamic rows, `src/data/static/*.json` + a `for` loop for tables |
| separate `*Locators` class | none: a `Locator` is lazy and auto-waits, so it lives next to the action that uses it |

## Rules for humans and AI agents

Each rule has a lint rule or a fixture behind it. `npm run verify` is the gate; do not disable a rule to make it pass.

| Rule | Enforced by |
|---|---|
| Import `test` and `expect` from `@/fixtures`, never from `@playwright/test` | `no-restricted-imports` |
| Tests do not contain locators. Add locators to a page object in `src/pages/` | `playwright/no-raw-locators` |
| Page objects do not contain `expect()` | `no-restricted-syntax` on `src/pages` |
| No `waitForTimeout` (sleep), no `force: true`, no `test.only`, no `test.skip` | Playwright lint rules |
| Assert with `await expect(locator)...`, which waits, not with `expect(await locator.isVisible())` | `prefer-web-first-assertions` |
| Every account a test creates is deleted: use `registeredUser`, or call `cleanup.track(user)` right after a UI signup | fixtures |
| Every test uses its own user from `buildUser()` and reads products through `pickProducts()`; static rows live in `src/data/static/` | convention |
| Tests are independent: no shared state, any order, in parallel | `fullyParallel: true` |

**Adding a test with an AI agent:** ask it to read this README and `src/fixtures/index.ts` first, add locators to the page object, write the test, then run `npm run verify` and paste the result. If a test fails, open the report before changing an assertion; never weaken an assertion or widen a locator just to go green.

**Exploring the site with an agent:** `.mcp.json` configures the Playwright MCP server, so Claude Code or a similar agent can open the real site and read the page structure before writing locators.

## Out of scope

CI/CD (how it would be added is in DECISIONS.md), multi-browser, performance testing, full coverage. Chromium only.
