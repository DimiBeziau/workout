import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'radial-gradient(ellipse at center, #12001a 0%, #08080f 70%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="glow-text-pink" style={{ color: 'var(--color-neon-pink)' }}>W</span>
            <span style={{ color: 'var(--color-text-primary)' }}>orkout</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Connectez-vous pour accéder à votre planning
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
