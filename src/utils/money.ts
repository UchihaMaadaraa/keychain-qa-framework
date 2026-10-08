// "Rs. 500" -> 500. Prices on this site are whole rupees, so strip everything that is not a digit.
// (Keeping the "." would turn "Rs. 500" into ".500" = 0.5. That bug was found by the first UI run.)
export function rupees(price: string): number {
  return Number(price.replace(/\D/g, ''));
}
