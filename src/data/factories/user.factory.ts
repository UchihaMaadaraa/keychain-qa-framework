import { randomUUID } from 'node:crypto';
import type { TestUser } from '@/types';

// Dynamic test data: a fresh user every call.
// (Java equivalent: a builder-style @DataProvider / test-data factory.)
//
// Why a function and not a JSON file: parallel workers and retries must never share an email,
// and this site rejects duplicates with "Email Address already exist!". A static row cannot be unique.
// Static, table-driven data lives next door in src/data/static/.
export function buildUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = randomUUID().slice(0, 8); // e.g. "3f9a1c2b"
  return {
    name: `QA User ${id}`,
    email: `qa-${id}@example.com`, // example.com is reserved: mail to it is never delivered
    password: `Pw!${id}x9`,
    title: 'Mr',
    birthDay: '15',
    birthMonth: '6',
    birthYear: '1990',
    firstName: 'QA',
    lastName: id,
    company: 'Keychain QA',
    address1: '221B Baker Street',
    address2: 'Floor 2',
    country: 'India',
    state: 'Haryana',
    city: 'Gurugram',
    zipcode: '122001',
    mobile: '9999999999',
    ...overrides,
  };
}
