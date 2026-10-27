/**
 * products.js: product list shown on Home + Products page.
 * TO ADD PHOTOS: put the file in /public/images/ (e.g. cement.jpg) and set image: '/images/cement.jpg'
 * If image is '' the emoji + color box is shown instead.
 * The text (name/hint) comes from i18n/translations.js using the id: product.<id>.name
 */
export const PRODUCTS = [
    { id: 'cement', color: 'bg-slate-200', emoji: '🧱', image: '' },
    { id: 'tmt', color: 'bg-orange-100', emoji: '🏗️', image: '' },
    { id: 'sand', color: 'bg-amber-100', emoji: '🏖️', image: '' },
    { id: 'gitti', color: 'bg-sky-100', emoji: '🪨', image: '' },
]
