/**
 * PostRequirement.jsx: CREATE REQUIREMENT MODULE
 * ---------------------------------------------------------------
 * Purpose : Customer form that creates requirements.
 * Route   : /post (customer role only, see App.jsx)
 * Tables  : requests (insert, one or many rows)
 * Storage : request-photos bucket (optional photo)
 *
 * TWO MODES
 *   Cart mode      URL /post?cart=1 (all cart items) or /post?product=cement
 *                  (one product). Shows the items with editable quantities and
 *                  creates ONE requirement per item (a requirement has a single
 *                  category, and different providers sell different materials).
 *                  Location, details and photo are shared by all items.
 *   Free-form mode Customer types the title, category and quantity (fabrication
 *                  work, custom jobs).
 *
 * DEBUG: Cart mode not showing? The URL must contain ?cart=1 or ?product=<id>
 *        and the cart must have items. Rows are rejected by the database when
 *        the pincode is not 6 digits (schema.sql Module 2).
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { PRODUCTS } from '../data/products'
import { T } from '../i18n/translations'
import { friendlyError, isValidPincode, checkPhoto } from '../lib/errors'
import { Page, Card, Input, Textarea, Select, Button, Field } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate', 'Bricks']
const en = (key) => T[key]?.en ?? key // database always stores English text

export default function PostRequirement() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const { user, profile } = useAuth()
    const { items, removeMany } = useCart()
    const { t } = useLang()

    const fromCart = params.get('cart') === '1'

    // ---- Cart-mode lines: [{ id, qty }] (qty is text while the user types) ----
    const [lines, setLines] = useState(() => {
        if (fromCart) {
            return PRODUCTS.filter((p) => items[p.id]).map((p) => ({ id: p.id, qty: String(items[p.id]) }))
        }
        const single = PRODUCTS.find((p) => p.id === params.get('product'))
        const q = Math.floor(Number(params.get('qty')))
        return single ? [{ id: single.id, qty: String(q >= 1 ? q : 1) }] : []
    })
    const cartMode = lines.length > 0

    // ---- Shared form state ----
    const [form, setForm] = useState({
        category: CATEGORIES[0], title: '', details: '', quantity: '',
        city: profile?.city ?? '', pincode: '',
    })
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
    const setLineQty = (id, v) =>
        setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty: v.replace(/\D/g, '') } : l)))
    const dropLine = (id) => setLines((ls) => ls.filter((l) => l.id !== id))

    // ---- Photo picker: rejects wrong type or size before upload ----
    function pickFile(e) {
        const f = e.target.files[0]
        const problem = checkPhoto(f)
        if (problem) {
            setError(problem)
            e.target.value = ''
            setFile(null)
            return
        }
        setError('')
        setFile(f ?? null)
    }

    // ---- Submit ----
    async function submit(e) {
        e.preventDefault()
        setError('')

        // Checks that mirror the database rules (instant messages)
        const pincode = form.pincode.trim()
        if (!isValidPincode(pincode)) {
            setError('Please enter a valid 6-digit pincode.')
            return
        }
        if (cartMode) {
            if (lines.some((l) => !(Number(l.qty) >= 1))) { setError(t('post.badQty')); return }
        } else {
            const title = form.title.trim()
            if (title.length < 3 || title.length > 120) {
                setError('The title must be between 3 and 120 characters.')
                return
            }
        }

        setBusy(true)

        // Step 1 (optional): upload the photo once into this user's own folder
        let photo_url = null
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('request-photos').upload(path, file)
            if (upErr) { setError(friendlyError(upErr)); setBusy(false); return }
            photo_url = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl
        }

        // Step 2: build the rows. Cart mode = one row per item.
        const common = {
            customer_id: user.id, details: form.details, city: form.city.trim(), pincode, photo_url,
        }
        const rows = cartMode
            ? lines.map((l) => {
                const p = PRODUCTS.find((x) => x.id === l.id)
                const unit = en(`product.${l.id}.unit`)
                return {
                    ...common,
                    category: p.category,
                    title: `${en(`product.${l.id}.name`)}: ${l.qty} ${unit}`,
                    quantity: `${l.qty} ${unit}`,
                }
            })
            : [{ ...common, category: form.category, title: form.title.trim(), quantity: form.quantity }]

        // Step 3: save (the database forces status = 'open')
        const { error: insErr } = await supabase.from('requests').insert(rows)
        setBusy(false)
        if (insErr) { setError(friendlyError(insErr)); return }

        // Step 4: remove the submitted items from the cart, then show the results
        if (cartMode && fromCart) removeMany(lines.map((l) => l.id))
        navigate('/my-requests')
    }

    // ---- UI ----
    return (
        <Page
            title={cartMode ? t('post.cart.title') : t('post.title')}
            subtitle={cartMode ? t('post.cart.subtitle') : t('post.subtitle')}
        >
            <form onSubmit={submit} className="space-y-4">

                {/* CART MODE: items with editable quantity */}
                {cartMode ? (
                    <Card className="space-y-3">
                        <p className="font-semibold">{t('post.cart.items')}</p>
                        {lines.map((l) => (
                            <div key={l.id} className="flex items-center gap-3">
                                <p className="min-w-0 flex-1 truncate font-medium">{t(`product.${l.id}.name`)}</p>
                                <input
                                    inputMode="numeric" value={l.qty} aria-label={t('cart.qty')}
                                    onChange={(e) => setLineQty(l.id, e.target.value)}
                                    className="h-11 w-20 rounded-xl border border-slate-300 text-center font-semibold outline-none focus:border-blue-brand"
                                />
                                <span className="w-14 text-sm text-muted">{t(`product.${l.id}.unit`)}</span>
                                <button type="button" onClick={() => dropLine(l.id)} aria-label={t('cart.remove')} className="p-1 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        <Field label={t('post.cart.details')}>
                            <Textarea rows={3} maxLength={2000} placeholder={t('post.cart.detailsPh')}
                                value={form.details} onChange={set('details')} />
                        </Field>
                    </Card>
                ) : (
                    /* FREE-FORM MODE: category, title, quantity, details */
                    <Card className="space-y-4">
                        <Field label={t('post.category')}>
                            <Select value={form.category} onChange={set('category')}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </Select>
                        </Field>
                        <Field label={t('post.what')}>
                            <Input placeholder={t('post.whatPh')} maxLength={120}
                                value={form.title} onChange={set('title')} required />
                        </Field>
                        <Field label={t('post.qty')}>
                            <Input placeholder={t('post.qtyPh')} value={form.quantity} onChange={set('quantity')} />
                        </Field>
                        <Field label={t('post.details')}>
                                <Textarea rows={3} maxLength={2000} placeholder={t('post.detailsPh')}
                                    value={form.details} onChange={set('details')} />
                        </Field>
                    </Card>
                )}

                {/* Location (both modes) */}
                <Card className="space-y-4">
                    <p className="font-semibold">{t('post.location')}</p>
                    <Field label={t('post.city')}>
                        <Input value={form.city} onChange={set('city')} required />
                    </Field>
                    <Field label={t('post.pincode')}>
                        <Input inputMode="numeric" maxLength={6} placeholder="e.g. 841226"
                            value={form.pincode} onChange={set('pincode')} required />
                    </Field>
                </Card>

                {/* Photo (both modes) */}
                <Card>
                    <Field label={t('post.photo')}>
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                            onChange={pickFile} className="block w-full text-sm" />
                    </Field>
                    {file && (
                        <img src={URL.createObjectURL(file)} alt="Preview"
                            className="mt-3 h-40 w-full rounded-xl object-cover" />
                    )}
                </Card>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={busy}>
                    {busy ? t('post.posting') : cartMode ? t('post.cart.submit') : t('post.submit')}
                </Button>
            </form>
        </Page>
    )
}