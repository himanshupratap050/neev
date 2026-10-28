/**
 * ProviderProducts.jsx: PROVIDER PRODUCT CATALOG
 * ---------------------------------------------------------------
 * Purpose : A provider lists the products they sell (name, price, unit,
 *           photo, stock). These show on the public shop page /shop/<id>.
 * Route   : /provider/products (provider role only, see App.jsx)
 * Tables  : provider_products (insert, update, delete own rows)
 * Storage : product-photos bucket (<user-id>/<timestamp>.<ext>)
 *
 * DEBUG: "relation provider_products does not exist" = run
 *        supabase/provider_setup.sql. Upload error = photo must be
 *        JPG, PNG or WebP and under 3 MB.
 */
import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { friendlyError, checkPhoto } from '../lib/errors'
import { Page, Grid, Card, Input, Textarea, Select, Button, Field, Badge, Empty, Spinner } from '../components/ui'

const BUCKET = 'product-photos'
const CATEGORIES = ['Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate', 'Bricks', 'Fabrication', 'Other']
const UNITS = ['bag', 'kg', 'piece', 'tonne', 'cft', 'truck load', 'sq ft', 'metre', 'service']
const EMPTY = { name: '', category: CATEGORIES[0], unit: UNITS[0], price: '', description: '', in_stock: true, photo_url: '' }

// Storage path of a public URL (used to delete the old photo)
const pathFromUrl = (url) => (url ? url.split(`/${BUCKET}/`)[1] : null)

export default function ProviderProducts() {
    const { user } = useAuth()
    const [list, setList] = useState([])
    const [form, setForm] = useState(EMPTY)
    const [editingId, setEditingId] = useState(null)
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    async function load() {
        const { data, error } = await supabase
            .from('provider_products').select('*')
            .eq('provider_id', user.id).order('created_at', { ascending: false })
        if (error) setError(friendlyError(error))
        setList(data ?? [])
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    function pickFile(e) {
        const f = e.target.files[0]
        const problem = checkPhoto(f)
        if (problem) { setError(problem); e.target.value = ''; setFile(null); return }
        setError('')
        setFile(f ?? null)
    }

    function reset() {
        setForm(EMPTY); setEditingId(null); setFile(null); setError('')
        const input = document.getElementById('product-photo-input')
        if (input) input.value = ''
    }

    function startEdit(p) {
        setEditingId(p.id)
        setForm({
            name: p.name, category: p.category ?? CATEGORIES[0], unit: p.unit ?? UNITS[0],
            price: p.price ?? '', description: p.description ?? '', in_stock: p.in_stock, photo_url: p.photo_url ?? '',
        })
        setFile(null); setError(''); setNotice('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function submit(e) {
        e.preventDefault()
        setError(''); setNotice('')
        const name = form.name.trim()
        if (name.length < 2 || name.length > 80) { setError('Product name must be 2 to 80 characters.'); return }
        if (form.price !== '' && !(Number(form.price) > 0)) { setError('Please enter a valid price.'); return }

        setBusy(true)
        let photo_url = form.photo_url || null

        // Upload a new photo (and remove the old one when replacing)
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file)
            if (upErr) { setError(friendlyError(upErr)); setBusy(false); return }
            const old = pathFromUrl(photo_url)
            if (old) await supabase.storage.from(BUCKET).remove([old])
            photo_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
        }

        const row = {
            name, category: form.category, unit: form.unit,
            price: form.price === '' ? null : Number(form.price),
            description: form.description.trim() || null,
            in_stock: form.in_stock, photo_url,
        }
        const { error: dbErr } = editingId
            ? await supabase.from('provider_products').update(row).eq('id', editingId)
            : await supabase.from('provider_products').insert({ ...row, provider_id: user.id })
        setBusy(false)
        if (dbErr) { setError(friendlyError(dbErr)); return }

        setNotice(editingId ? 'Product updated.' : 'Product added.')
        reset()
        load()
    }

    async function toggleStock(p) {
        const { error } = await supabase.from('provider_products').update({ in_stock: !p.in_stock }).eq('id', p.id)
        if (error) { setError(friendlyError(error)); return }
        load()
    }

    async function remove(p) {
        if (!window.confirm(`Delete "${p.name}"?`)) return
        const { error } = await supabase.from('provider_products').delete().eq('id', p.id)
        if (error) { setError(friendlyError(error)); return }
        const old = pathFromUrl(p.photo_url)
        if (old) await supabase.storage.from(BUCKET).remove([old])
        if (editingId === p.id) reset()
        load()
    }

    if (loading) return <Spinner />

    const small = 'rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50'

    return (
        <Page size="wide" title="My products" subtitle="Products you list here appear on your public shop page.">

            {/* ---------- Add / edit form ---------- */}
            <Card>
                <h3 className="font-semibold">{editingId ? 'Edit product' : 'Add a product'}</h3>
                <form onSubmit={submit} className="mt-3 grid gap-4 md:grid-cols-2">
                    <Field label="Product name">
                        <Input maxLength={80} placeholder="e.g. UltraTech Cement 50 kg" value={form.name} onChange={set('name')} required />
                    </Field>
                    <Field label="Category">
                        <Select value={form.category} onChange={set('category')}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                    </Field>
                    <Field label="Price (₹), leave empty for 'ask for quote'">
                        <Input type="number" min="1" step="any" placeholder="e.g. 380" value={form.price} onChange={set('price')} />
                    </Field>
                    <Field label="Per">
                        <Select value={form.unit} onChange={set('unit')}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                        </Select>
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Description (optional)">
                            <Textarea rows={2} maxLength={500} placeholder="Brand, grade, delivery details..." value={form.description} onChange={set('description')} />
                        </Field>
                    </div>
                    <Field label="Photo (JPG, PNG or WebP, max 3 MB)">
                        <input id="product-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="block w-full text-sm" />
                        {form.photo_url && !file && <img src={form.photo_url} alt="" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
                    </Field>
                    <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
                        <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} className="h-5 w-5" />
                        In stock
                    </label>

                    {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
                    {notice && <p className="text-sm text-green-700 md:col-span-2">{notice}</p>}

                    <div className="flex gap-3 md:col-span-2">
                        <Button disabled={busy}>{busy ? 'Saving...' : editingId ? 'Save changes' : 'Add product'}</Button>
                        {editingId && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}
                    </div>
                </form>
            </Card>

            {/* ---------- Product list ---------- */}
            {list.length === 0 && <Empty icon={Package} text="No products yet. Add your first product above." />}
            <Grid>
                {list.map((p) => (
                    <Card key={p.id}>
                        {p.photo_url
                            ? <img src={p.photo_url} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} className="mb-3 h-40 w-full rounded-xl object-cover" />
                            : <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-slate-100 text-4xl">📦</div>}
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-snug">{p.name}</h3>
                            <Badge tone={p.in_stock ? 'green' : 'gray'}>{p.in_stock ? 'In stock' : 'Out of stock'}</Badge>
                        </div>
                        <p className="mt-1 text-lg font-bold">
                            {p.price ? `₹${Number(p.price).toLocaleString('en-IN')} / ${p.unit ?? 'unit'}` : 'Ask for quote'}
                        </p>
                        <p className="text-xs text-muted">{p.category}</p>
                        {p.description && <p className="mt-2 text-sm text-muted">{p.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => startEdit(p)} className={small}>Edit</button>
                            <button onClick={() => toggleStock(p)} className={small}>{p.in_stock ? 'Mark out of stock' : 'Mark in stock'}</button>
                            <button onClick={() => remove(p)} className={small + ' !border-red-200 text-red-600'}>Delete</button>
                        </div>
                    </Card>
                ))}
            </Grid>
        </Page>
    )
}