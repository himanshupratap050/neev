/**
 * products.js: PRODUCT CATALOG (static)
 * ---------------------------------------------------------------
 * Purpose : Products shown on Home, Products page, cart and drawer.
 * Fields  : id        key used in the cart and in translations
 *           category  value saved in requests.category (must match
 *                     the provider categories exactly)
 *           image     file in /public/images (emoji + color is the fallback)
 * Text    : name, hint and unit come from i18n/translations.js
 *           (product.<id>.name / .hint / .unit)
 */
export const PRODUCTS = [
    { id: 'cement', category: 'Cement', color: 'bg-slate-200', emoji: '🧱', image: '/images/cement.webp' },
    { id: 'tmt', category: 'TMT / Steel', color: 'bg-orange-100', emoji: '🏗️', image: '/images/tmt.webp' },
    { id: 'sand', category: 'Sand', color: 'bg-amber-100', emoji: '🏖️', image: '/images/sand.webp' },
    { id: 'gitti', category: 'Gitti / Aggregate', color: 'bg-sky-100', emoji: '🪨', image: '/images/gitti.webp' },
]