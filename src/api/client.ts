import type { APIRequestContext, APIResponse } from '@playwright/test';

// Base for every API module. Holds the HTTP client and the one piece of shared behaviour:
// parse JSON, or fail with a readable message if the site returned an HTML error page.
// (Java equivalent: a RestAssured base class with the RequestSpecification.)
//
// Two things to know about this API (https://automationexercise.com/api_list):
//   1. The HTTP status is almost always 200. The REAL status is `responseCode` in the body.
//      So every method returns the parsed body, and tests check body.responseCode / body.message.
//   2. POST / PUT / DELETE expect form fields (Playwright's `form:` option), not a JSON body.
export abstract class ApiClient {
  protected constructor(protected readonly request: APIRequestContext) {}

  protected async json<T>(pending: Promise<APIResponse>): Promise<T> {
    const res = await pending;
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Expected JSON from ${res.url()} (HTTP ${res.status()}) but got:\n${text.slice(0, 200)}`);
    }
  }
}
