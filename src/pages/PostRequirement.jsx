/**
 * PostRequirement.jsx: CREATE REQUIREMENT MODULE
 * ---------------------------------------------------------------
 * Purpose : Customer form to post a new requirement (what they need,
 *           quantity, location, optional photo).
 * Route   : /post (customer role only, see App.jsx)
 * Tables  : requests (insert)
 * Storage : request-photos bucket (photo upload)
 * Flow    : validate form -> upload photo (optional) -> insert row
 *           -> go to /my-requests
 *
 * DEBUG: Upload fails with a row-level security error = the file path
 *        must start with the user's id (it does: `${user.id}/...`).
 *        If the DB rejects the pincode, helpers in lib/errors.js and the
 *        constraint in schema.sql Module 2 must match.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { friendlyError, isValidPincode, checkPhoto } from '../lib/errors'
import { Page, Card, Input, Textarea, Select, Button, Field } from '../components/ui'

const CATEGORIES = ['Fabrication', 'Cement', 'TMT / Steel', 'Sand', 'Gitti / Aggregate']

export default function PostRequirement() {
    const navigate = useNavigate()
    const { user, profile } = useAuth()

    // ---- Form state ----
    const [form, setForm] = useState({
        category: CATEGORIES[0], title: '', details: '', quantity: '',
        city: profile?.city ?? '', pincode: '',
    })
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // Returns an onChange handler that updates one form field
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

    // ---- Photo picker: rejects wrong type or size before upload ----
    function pickFile(e) {
        const f = e.target.files[0]
        const problem = checkPhoto(f)
        if (problem) {
            setError(problem)
            e.target.value = ''   // clear the chosen file
            setFile(null)
            return
        }
        setError('')
        setFile(f ?? null)
    }

    // ---- Submit: validate, upload photo, save request ----
    async function submit(e) {
        e.preventDefault()
        setError('')

        // Checks that mirror the database rules (shows a message instantly)
        const title = form.title.trim()
        if (title.length < 3 || title.length > 120) {
            setError('The title must be between 3 and 120 characters.')
            return
        }
        if (!isValidPincode(form.pincode)) {
            setError('Please enter a valid 6-digit pincode.')
            return
        }

        setBusy(true)

        // Step 1 (optional): upload the photo into this user's own folder
        let photo_url = null
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase()
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('request-photos').upload(path, file)
            if (upErr) { setError(friendlyError(upErr)); setBusy(false); return }
            photo_url = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl
        }

        // Step 2: save the request (the database forces status = 'open')
        const { error: insErr } = await supabase.from('requests').insert({
            customer_id: user.id, ...form, title, pincode: form.pincode.trim(), photo_url,
        })
        setBusy(false)
        if (insErr) { setError(friendlyError(insErr)); return }
        navigate('/my-requests')
    }

    // ---- UI ----
    return (
        <Page title="Post a requirement" subtitle="Describe what you need. Verified providers nearby will send you quotes.">
            <form onSubmit={submit} className="space-y-4">

                {/* What do you need */}
                <Card className="space-y-4">
                    <Field label="Category">
                        <Select value={form.category} onChange={set('category')}>
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </Select>
                    </Field>
                    <Field label="What do you need?">
                        <Input placeholder="e.g. Main gate, 50 bags of cement" maxLength={120}
                            value={form.title} onChange={set('title')} required />
                    </Field>
                    <Field label="Quantity or size">
                        <Input placeholder="e.g. 10 x 6 ft, 50 bags" value={form.quantity} onChange={set('quantity')} />
                    </Field>
                    <Field label="Additional details">
                        <Textarea rows={3} placeholder="Design, material grade, delivery date"
                            value={form.details} onChange={set('details')} />
                    </Field>
                </Card>

                {/* Where */}
                <Card className="space-y-4">
                    <p className="font-semibold">Location</p>
                    <Field label="City">
                        <Input value={form.city} onChange={set('city')} required />
                    </Field>
                    <Field label="Pincode (6 digits)">
                        <Input inputMode="numeric" maxLength={6} placeholder="e.g. 841226"
                            value={form.pincode} onChange={set('pincode')} required />
                    </Field>
                </Card>

                {/* Photo */}
                <Card>
                    <Field label="Photo (optional, JPG/PNG/WebP, max 3 MB)">
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                            onChange={pickFile} className="block w-full text-sm" />
                    </Field>
                    {file && (
                        <img src={URL.createObjectURL(file)} alt="Preview"
                            className="mt-3 h-40 w-full rounded-xl object-cover" />
                    )}
                </Card>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button disabled={busy}>{busy ? 'Posting...' : 'Post requirement'}</Button>
            </form>
        </Page>
    )
}