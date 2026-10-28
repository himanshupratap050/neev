/**
 * ProductList: full Products page.
 * Search (name/hint), category filter and price sort. Filters live in the URL,
 * so the navbar search and the Home category chips can link straight here.
 */
import { useSearchParams } from 'react-router-dom'
import { PRODUCTS } from '../data/products'
import { useLang } from '../context/LangContext'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
    const { t } = useLang()
    const [sp, setSp] = useSearchParams()
    const q = sp.get('q') || ''
    const cat = sp.get('cat') || 'all'
    const sort = sp.get('sort') || 'default'

    // Change one URL parameter (empty/default values are removed to keep the URL clean)
    const set = (k, v) => { const n = new URLSearchParams(sp); (v && v !== 'all' && v !== 'default') ? n.set(k, v) : n.delete(k); setSp(n) }

    // Filter by category, then by search text (matches the translated name or hint)
    let list = PRODUCTS.filter(p => (cat === 'all' || p.id === cat) &&
        (t(`product.${p.id}.name`) + ' ' + t(`product.${p.id}.hint`)).toLowerCase().includes(q.trim().toLowerCase()))
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)

    const chip = on => `rounded-full px-4 py-1.5 text-sm font-semibold ${on ? 'bg-slate-brand text-white' : 'bg-white text-slate-brand border border-slate-300'}`
    return (
        <div className="mx-auto min-h-[70vh] max-w-7xl px-4 pt-10">
            <h1 className="text-2xl font-bold">{t('products.title')}</h1>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                <input value={q} onChange={e => set('q', e.target.value)} placeholder={t('nav.search')} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 md:max-w-sm" />
                <select value={sort} onChange={e => set('sort', e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
                    <option value="default">{t('list.sort')}</option>
                    <option value="low">{t('list.low')}</option>
                    <option value="high">{t('list.high')}</option>
                </select>
            </div>
            {/* Category chips */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {['all', ...PRODUCTS.map(p => p.id)].map(c => <button key={c} onClick={() => set('cat', c)} className={chip(cat === c)}>{t(`cat.${c}`)}</button>)}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>
            {list.length === 0 && <p className="mt-8 text-center text-muted">{t('list.empty')}</p>}
        </div>
    )
}
