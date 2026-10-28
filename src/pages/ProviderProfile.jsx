/**
 * ProviderProfile.jsx: SHOP PROFILE (edit shop and owner details)
 * ---------------------------------------------------------------
 * Purpose : A provider edits the shop name, category, area, description
 *           and their own name and phone.
 * Route   : /provider/profile (provider role only, see App.jsx)
 * Tables  : providers (update own row), profiles (update own row)
 *
 * NOTE    : category and pincode decide which leads the provider sees
 *           (same category, same first 3 pincode digits).
 * DEBUG   : "valid phone number" error = 10 to 15 characters, digits,
 *           +, space or - only (profiles_phone_chk in the database).
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { friendlyError, isValidPhone, isValidPincode } from '../lib/errors'
import { Page, Card, Input, Textarea, Select, Button, Field, Badge, Spinner } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate', 'Bricks']

export default function ProviderProfile() {
    const { user, profile, reloadProfile } = useAuth()
    const [form, setForm] = useState(null)
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        async function load() {
            const { data } = await supabase.from('providers').select('*').eq('id', user.id).maybeSingle()
            setVerified(!!data?.verified)
            setForm({
                shop_name: data?.shop_name ?? '', category: data?.category ?? CATEGORIES[0],
                city: data?.city ?? '', pincode: data?.pincode ?? '', description: data?.description ?? '',
                name: profile?.name ?? '', phone: profile?.phone ?? '',
            })
        }
        load()
    }, [user.id, profile])

    if (!form) return <Spinner />
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    async function save(e) {
        e.preventDefault()
        setError(''); setNotice('')
        if (form.shop_name.trim().length < 2) { setError('Please enter your shop name.'); return }
        if (!isValidPincode(form.pincode)) { setError('Please enter a valid 6-digit pincode.'); return }
        if (!isValidPhone(form.phone)) { setError('Please enter a valid phone number (10 to 15 digits).'); return }

        setBusy(true)
        const { error: e1 } = await supabase.from('providers').update({
            shop_name: form.shop_name.trim(), category: form.category, city: form.city.trim(),
            pincode: form.pincode.trim(), description: form.description.trim() || null,
        }).eq('id', user.id)
        if (e1) { setError(friendlyError(e1)); setBusy(false); return }

        const { error: e2 } = await supabase.from('profiles').update({
            name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(),
        }).eq('id', user.id)
        setBusy(false)
        if (e2) { setError(friendlyError(e2)); return }

        await reloadProfile()
        setNotice('Shop profile saved.')
    }

    return (
        <Page title="Shop profile" subtitle="Customers see this on your public shop page.">
            <div className="flex flex-wrap items-center gap-3">
                <Badge tone={verified ? 'green' : 'amber'}>{verified ? 'Verified' : 'Verification pending'}</Badge>
                <Link to={`/shop/${user.id}`} className="text-sm font-semibold text-blue-brand">View public shop page</Link>
            </div>

            <form onSubmit={save} className="space-y-4">
                <Card className="space-y-4">
                    <p className="font-semibold">Shop details</p>
                    <Field label="Shop or workshop name">
                        <Input value={form.shop_name} onChange={set('shop_name')} required />
                    </Field>
                    <Field label="Primary category">
                        <Select value={form.category} onChange={set('category')}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                    </Field>
                    <Field label="City">
                        <Input value={form.city} onChange={set('city')} required />
                    </Field>
                    <Field label="Pincode (6 digits)">
                        <Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={set('pincode')} required />
                    </Field>
                    <p className="-mt-2 text-xs text-muted">
                        You get leads of your category from your pincode area (same first 3 digits).
                    </p>
                    <Field label="About your shop">
                        <Textarea rows={4} maxLength={500} placeholder="What you sell, how long you have been in business, delivery area..."
                            value={form.description} onChange={set('description')} />
                    </Field>
                </Card>

                <Card className="space-y-4">
                    <p className="font-semibold">Owner contact</p>
                    <Field label="Your name">
                        <Input value={form.name} onChange={set('name')} required />
                    </Field>
                    <Field label="Phone number">
                        <Input type="tel" inputMode="numeric" maxLength={15} value={form.phone} onChange={set('phone')} required />
                    </Field>
                    <p className="-mt-2 text-xs text-muted">
                        Your phone is shown to a customer only after they accept your quote.
                    </p>
                </Card>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {notice && <p className="text-sm text-green-700">{notice}</p>}
                <Button disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
            </form>
        </Page>
    )
}