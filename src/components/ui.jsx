export function Page({ title, subtitle, children }) {
    return (
        <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-2xl">
            {title && <h1 className="text-2xl font-bold">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-4 space-y-4">{children}</div>
        </div>
    )
}

export function Card({ children, className = '' }) {
    return (
        <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
            {children}
        </div>
    )
}

export function Button({ variant = 'primary', className = '', ...props }) {
    const styles = {
        primary: 'bg-amber-brand text-white hover:bg-orange-600',
        dark: 'bg-slate-brand text-white hover:bg-slate-800',
        outline: 'border border-slate-300 bg-white text-slate-brand hover:bg-slate-50',
        success: 'bg-green-600 text-white hover:bg-green-700',
    }
    return (
        <button
            {...props}
            className={`min-h-12 w-full rounded-xl px-5 py-3 text-base font-semibold transition disabled:opacity-60 ${styles[variant]} ${className}`}
        />
    )
}

const field =
    'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-brand focus:ring-2 focus:ring-blue-brand/20'

export function Input(props) {
    return <input {...props} className={field} />
}
export function Textarea(props) {
    return <textarea {...props} className={field} />
}
export function Select(props) {
    return <select {...props} className={field} />
}

export function Badge({ tone = 'gray', children }) {
    const tones = {
        gray: 'bg-slate-100 text-slate-600',
        green: 'bg-green-100 text-green-700',
        amber: 'bg-amber-100 text-amber-700',
        blue: 'bg-sky-100 text-sky-700',
    }
    return (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    )
}

export function Empty({ icon: Icon, text }) {
    return (
        <Card className="py-10 text-center text-muted">
            {Icon && <Icon className="mx-auto mb-2 h-8 w-8" />}
            <p>{text}</p>
        </Card>
    )
}

export function Spinner() {
    return <p className="p-6 text-center text-muted">Loading...</p>
}