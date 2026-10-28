/**
 * errors.js: ERROR AND VALIDATION HELPERS
 * ---------------------------------------------------------------
 * Purpose : (1) friendlyError()   turns raw database/auth errors into
 *               plain English for the user.
 *           (2) isValidPhone / isValidPincode / photo rules, which mirror
 *               the database rules in schema.sql (Module 2 and Module 9).
 * Used by : Signup, PostRequirement, ProviderLeads, MyRequests
 *
 * DEBUG: A new technical message shows up on screen? Open F12 -> Console,
 *        copy the raw message, and add one more `has('...')` line in
 *        friendlyError() below.
 */

// ---- Rules (keep in sync with schema.sql) ----
export const isValidPhone = (v) => /^[0-9+ -]{10,15}$/.test((v ?? '').trim())
export const isValidPincode = (v) => /^[0-9]{6}$/.test((v ?? '').trim())

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024 // 3 MB

// Returns an error message string, or '' if the photo is acceptable.
export function checkPhoto(file) {
    if (!file) return ''
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return 'Please choose a JPG, PNG or WebP photo. iPhone HEIC photos are not supported.'
    }
    if (file.size > MAX_PHOTO_BYTES) return 'Photo must be smaller than 3 MB.'
    return ''
}

// ---- Error translator ----
export function friendlyError(error) {
    const msg = (error?.message ?? String(error ?? '')).toLowerCase()
    const has = (text) => msg.includes(text)

    // Database validation rules (schema.sql Module 2)
    if (has('profiles_phone_chk')) return 'Please enter a valid phone number (10 to 15 digits).'
    if (has('pincode_chk')) return 'Please enter a valid 6-digit pincode.'
    if (has('requests_title_chk')) return 'The title must be between 3 and 120 characters.'
    if (has('quotes_price_chk')) return 'Please enter a valid price.'

    // Text length limits (schema_fixes.sql)
    if (has('quotes_message_chk') || has('reviews_comment_chk')) {
        return 'Your message is too long (maximum 500 characters).'
    }
    if (has('requests_details_chk')) return 'Details are too long (maximum 2000 characters).'
    if (has('provider_products_name_chk')) return 'Product name must be 2 to 80 characters.'
    if (has('provider_products_price_chk')) return 'Please enter a valid price.'
    if (has('provider_products_desc_chk')) return 'Description is too long (maximum 500 characters).'

    // Duplicates (unique rules)
    if (has('quotes_one_per_provider')) return 'You have already sent a quote for this requirement.'
    if (has('reviews_one_per_request')) return 'You have already reviewed this job.'

    // Guards (schema.sql Module 4 and 6)
    // This one must stay ABOVE the general guard line below.
    if (has('while it has no quotes')) {
        return 'Quotes have already arrived, so this requirement can no longer be edited.'
    }
    if (has('invalid status change') || has('edited only while')
        || has('not found or request is not open')) {
        return 'This requirement has changed. Please refresh the page and try again.'
    }

    // Row Level Security (permission) errors
    if (has('row-level security') || has('violates row-level')) {
        return 'This action is not available for your account, or the requirement is no longer open.'
    }

    // Photo upload (schema.sql Module 9)
    if (has('mime type')) return 'Please choose a JPG, PNG or WebP photo.'
    if (has('maximum allowed size') || has('payload too large')) return 'Photo must be smaller than 3 MB.'

    // Authentication
    if (has('invalid login credentials')) return 'Incorrect email or password.'
    if (has('email not confirmed')) return 'Please confirm your email first, or turn off "Confirm email" in Supabase.'
    if (has('user already registered')) return 'An account with this email already exists. Please log in.'
    if (has('password should be at least')) return 'Your password must have at least 6 characters.'
    if (has('unable to validate email') || has('invalid email')) return 'Please enter a valid email address.'
    if (has('rate limit')) return 'Too many attempts. Please wait a minute and try again.'
    if (has('database error saving new user')) {
        return 'Could not create your account. Please check your details and try again.'
    }

    // Network
    if (has('failed to fetch') || has('network')) {
        return 'Network problem. Check your internet connection and try again.'
    }

    return 'Something went wrong. Please try again.'
}