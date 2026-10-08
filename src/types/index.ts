// Shared shapes. One definition, used by the API client, the data layer, the pages and the tests.
// (Java equivalent: your POJO / model package.)

export type TestUser = {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs';
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: 'India' | 'United States' | 'Canada' | 'Australia';
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
};

export type Credentials = Pick<TestUser, 'email' | 'password'>;

export type Product = {
  id: number;
  name: string;
  price: string; // e.g. "Rs. 500"
  brand: string;
  category: { category: string };
};

export type Brand = { id: number; brand: string };

export type UserDetail = {
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  city: string;
  zipcode: string;
};

// Every API response has these two fields, plus whatever the endpoint adds.
// The HTTP status on this site is almost always 200; `responseCode` is the real one.
export type ApiBody<Extra = object> = { responseCode: number; message?: string } & Extra;

// One row of the cart table, as plain data.
export type CartLine = { name: string; price: string; quantity: string; total: string };
