import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { trackLogin } from '../../lib/tracking'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials') || authError.message.includes('invalid')) {
          setError('Email ou senha inválidos.')
        } else {
          setError(`Erro: ${authError.message}`)
        }
        return
      }

      if (authData.user) {
        await fetchProfile(authData.user.id)
        let profile = useAuthStore.getState().user

        if (!profile) {
          // Self-healing: Tenta criar o perfil do lado do cliente se não existir
          try {
            const { data: partData } = await supabase
              .from('participants')
              .select('organization_id, full_name')
              .eq('email', authData.user.email || '')
              .maybeSingle()

            const orgId = partData?.organization_id || null
            const fullName = partData?.full_name || authData.user.user_metadata?.full_name || authData.user.email || ''

            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                organization_id: orgId,
                full_name: fullName,
                email: authData.user.email!,
                role: 'participant'
              })

            if (!insertError) {
              await fetchProfile(authData.user.id)
              profile = useAuthStore.getState().user
              
              if (profile) {
                // Vincula o participante se ainda não estiver vinculado
                await supabase
                  .from('participants')
                  .update({ user_id: authData.user.id, access_status: 'active', status: 'ativo' })
                  .eq('email', authData.user.email!)
                  .is('user_id', null)
              }
            }
          } catch (selfHealErr) {
            console.error('Self-healing profile creation failed:', selfHealErr)
          }
        }

        if (!profile) {
          setError('Usuário autenticado, mas perfil não encontrado. Contate o suporte.')
          await supabase.auth.signOut()
          return
        }

        if (profile.role === 'admin' || profile.role === 'operator') {
          const { ensureOrganization } = useAuthStore.getState()
          const orgId = await ensureOrganization()
          if (orgId) {
            await trackLogin(profile.id, orgId)
          }
          navigate('/admin', { replace: true })
        } else {
          const orgId = profile.organization_id
          if (orgId) {
            await trackLogin(profile.id, orgId)
          }
          navigate('/app/dashboard', { replace: true })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setError(`Erro de conexão: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet><title>Login | Envolve</title></Helmet>
      <div className="min-h-screen bg-[#0A0706] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black">
                E
              </div>
              <span className="text-xl font-bold text-[#F5E6C4]">Envolve</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#F5E6C4]">Bem-vindo de volta</h1>
            <p className="text-stone-500 mt-2">Acesse sua área exclusiva</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-[#16120F] border border-stone-800/50 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              id="password"
              type="password"
              placeholder="••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Entrar <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center">
              <Link
                to="/reset-password"
                className="text-sm text-stone-500 hover:text-[#D4AF37] transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>
          </form>

          <p className="text-center text-sm text-stone-600 mt-6">
            Ainda não tem conta?{' '}
            <Link to="/" className="text-[#D4AF37] hover:underline">
              Garanta sua vaga
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
