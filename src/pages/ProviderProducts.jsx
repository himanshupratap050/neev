/**
 * ProviderProducts: provider lists their own products (name, price, photo).
 * PROTOTYPE: saved in this browser (localStorage). Later: replace load/save with Supabase.
 */
import { useState } from 'react'
import { useLang } from '../context/LangContext'

const KEY = 'neev-provider-products'

export default function ProviderProducts() {
    const { t } = useLang()
    const [list, setList] = useState(() => JSON.parse(localStorage.getItem(KEY) || '[]'))
    const [form, setForm] = useState({ name: '', price: '', photo: '' })

    // Read the chosen photo as a data-URL so it can be saved and shown
    function pickPhoto(e) {
        const f = e.target.files[0]
        if (!f) return
        const r = new FileReader()
        r.onload = () => setForm(x => ({ ...x, photo: r.result }))
        r.readAsDataURL(f)
    }
    function save(next) { setList(next); localStorage.setItem(KEY, JSON.stringify(next)) }
    function add(e) {
        e.preventDefault()
        if (!form.name) return
        save([...list, { ...form, id: Date.now() }])
        setForm({ name: '', price: '', photo: '' })
    }
    const input = 'w-full rounded-lg border border-slate-300 p-2.5'
    return (
        <div className="mx-auto max-w-3xl p-4 md:p-8">
            <h1 className="text-2xl font-bold">{t('prov.title')}</h1>
            <form onSubmit={add} className="mt-4 space-y-3 rounded-2xl bg-white p-4">
                <input className={input} placeholder={t('prov.name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className={input} placeholder={t('prov.price')} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                <input type="file" accept="image/*" onChange={pickPhoto} />
                <button className="w-full rounded-xl bg-amber-brand py-3 font-semibold text-white">{t('prov.add')}</button>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {list.length === 0 && <p className="text-muted">{t('prov.empty')}</p>}
                {list.map(p => (
                    <div key={p.id} className="flex gap-3 rounded-xl bg-white p-3">
                        {p.photo ? <img src={p.photo} className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-slate-100" />}
                        <div className="flex-1"><p className="font-semibold">{p.name}</p><p className="text-sm text-muted">{p.price}</p></div>
                        <button onClick={() => save(list.filter(x => x.id !== p.id))} className="text-sm text-red-600">{t('cart.remove')}</button>
                    </div>
                ))}
            </div>
        </div>
    )
}
