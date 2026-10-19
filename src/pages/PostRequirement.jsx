import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Page, Card, Input, Textarea, Select, Button, Field } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

export default function PostRequirement() {
    const navigate = useNavigate()
    const { user, profile } = useAuth()
    const [form, setForm] = useState({
        category: CATEGORIES[0], title: '', details: '', quantity: '',
        city: profile?.city ?? '', pincode: '',
    })
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    function pickFile(e) {
        const f = e.target.files[0]
        if (f && f.size > 3 * 1024 * 1024) {
            setError('Photo must be smaller than 3 MB.')
            e.target.value = ''
            return
        }
        setError('')
        setFile(f ?? null)
    }

    async function submit(e) {
        e.preventDefault()
        setError('')
        setBusy(true)

        let photo_url = null
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('request-photos').upload(path, file)
            if (upErr) { setError(upErr.message); setBusy(false); return }
            photo_url = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl
        }

        const { error: insErr } = await supabase.from('requests').insert({
            customer_id: user.id, ...form, photo_url,
        })
        setBusy(false)
        if (insErr) { setError(insErr.message); return }
        navigate('/my-requests')
    }

    return (
        <Page title="Post a requirement" subtitle="Describe what you need. Verified providers nearby will send you quotes.">
            <form onSubmit={submit} className="space-y-4">
                <Card className="space-y-4">
                    <Field label="Category">
                        <Select value={form.category} onChange={set('category')}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                    </Field>
                    <Field label="What do you need?">
                        <Input placeholder="e.g. Main gate, 50 bags of cement" value={form.title} onChange={set('title')} required />
                    </Field>
                    <Field label="Quantity or size">
                        <Input placeholder="e.g. 10 x 6 ft, 50 bags" value={form.quantity} onChange={set('quantity')} />
                    </Field>
                    <Field label="Additional details">
                        <Textarea rows={3} placeholder="Design, material grade, delivery date" value={form.details} onChange={set('details')} />
                    </Field>
                </Card>

                <Card className="space-y-4">
                    <p className="font-semibold">Location</p>
                    <Field label="City">
                        <Input value={form.city} onChange={set('city')} required />
                    </Field>
                    <Field label="Pincode">
                        <Input inputMode="numeric" value={form.pincode} onChange={set('pincode')} required />
                    </Field>
                </Card>

                <Card>
                    <Field label="Photo (optional, max 3 MB)">
                        <input type="file" accept="image/*" onChange={pickFile} className="block w-full text-sm" />
                    </Field>
                    {file && (
                        <img src={URL.createObjectURL(file)} alt="Preview" className="mt-3 h-40 w-full rounded-xl object-cover" />
                    )}
                </Card>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={busy}>{busy ? 'Posting...' : 'Post requirement'}</Button>
            </form>
        </Page>
    )
}