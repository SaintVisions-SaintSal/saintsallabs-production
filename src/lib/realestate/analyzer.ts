/**
 * Real Estate Analyzer — SaintSalLabs
 * Helper utilities for real estate investment calculations.
 */

/**
 * Calculates the Capitalization Rate (Cap Rate) for a property.
 *
 * Cap Rate = NOI / Purchase Price
 * Expressed as a decimal (e.g., 0.08 = 8%).
 *
 * @param noi - Net Operating Income (annual, in dollars)
 * @param price - Purchase / asking price of the property (in dollars)
 * @returns Cap rate as a decimal, or 0 if price is 0
 */
export function calculateCapRate(noi: number, price: number): number {
  if (price === 0) return 0;
  return noi / price;
}

/**
 * Calculates Net Operating Income (NOI).
 *
 * NOI = Gross Income − Operating Expenses (annual).
 * Input values should be monthly; this function annualizes them.
 *
 * @param grossIncome - Monthly gross rental income (in dollars)
 * @param expenses - Monthly operating expenses (in dollars)
 * @returns Annual NOI in dollars
 */
export function calculateNOI(grossIncome: number, expenses: number): number {
  return (grossIncome - expenses) * 12;
}

/**
 * Calculates the Gross Rent Multiplier (GRM).
 *
 * GRM = Purchase Price / Annual Gross Rent
 * Lower GRM generally indicates a better deal.
 *
 * @param price - Purchase / asking price of the property (in dollars)
 * @param grossRent - Annual gross rental income (in dollars)
 * @returns GRM as a number, or 0 if grossRent is 0
 */
export function calculateGRM(price: number, grossRent: number): number {
  if (grossRent === 0) return 0;
  return price / grossRent;
}

/**
 * Checks whether a property meets the 1% Rule.
 *
 * The 1% Rule: Monthly rent ≥ 1% of the purchase price.
 * Example: $200,000 property → monthly rent should be ≥ $2,000.
 *
 * @param price - Purchase / asking price of the property (in dollars)
 * @param monthlyRent - Monthly gross rental income (in dollars)
 * @returns true if the property passes the 1% rule
 */
export function checkOnePercentRule(
  price: number,
  monthlyRent: number
): boolean {
  if (price === 0) return false;
  return monthlyRent / price >= 0.01;
}

/**
 * Formats a numeric dollar amount into a human-readable currency string.
 *
 * @param amount - Dollar amount to format
 * @returns Formatted string, e.g. "$1,250,000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Returns a letter-grade Deal Rating based on the Cap Rate.
 *
 * Grading scale:
 *  - A: Cap Rate ≥ 10%
 *  - B: Cap Rate ≥ 7% and < 10%
 *  - C: Cap Rate ≥ 5% and < 7%
 *  - D: Cap Rate ≥ 3% and < 5%
 *  - F: Cap Rate < 3%
 *
 * @param capRate - Cap rate as a decimal (e.g., 0.08 for 8%)
 * @returns Deal rating letter grade
 */
export function getDealRating(capRate: number): "A" | "B" | "C" | "D" | "F" {
  if (capRate >= 0.10) return "A";
  if (capRate >= 0.07) return "B";
  if (capRate >= 0.05) return "C";
  if (capRate >= 0.03) return "D";
  return "F";
}
