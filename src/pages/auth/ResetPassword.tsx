import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, ArrowLeft } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type EmailForm = z.infer<typeof emailSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ResetPassword() {
  const [isRecovery, setIsRecovery] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsRecovery(true)
      }
      setCheckingSession(false)
    })
  }, [])

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSendEmail = async (data: EmailForm) => {
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message || 'Erro ao enviar email. Tente novamente.')
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  const onUpdatePassword = async (data: PasswordForm) => {
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError(updateError.message || 'Erro ao atualizar senha. O link pode ter expirado.')
    } else {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0A0706] flex flex-col items-center justify-center p-4">
        <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Recuperar Senha | Envolve</title></Helmet>
      <div className="min-h-screen bg-[#0A0706] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black">
                E
              </div>
              <span className="text-xl font-bold text-[#F5E6C4]">Envolve</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#F5E6C4]">
              {isRecovery ? 'Nova senha' : 'Recuperar senha'}
            </h1>
            <p className="text-stone-500 mt-2">
              {isRecovery
                ? 'Digite sua nova senha abaixo.'
                : sent
                  ? 'Email enviado! Verifique sua caixa de entrada.'
                  : 'Digite seu email para receber o link de recuperação'}
            </p>
          </div>

          {isRecovery ? (
            <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="bg-[#16120F] border border-stone-800/50 rounded-2xl p-8 space-y-5">
              {error && (
                <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Nova senha"
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                icon={<Lock className="w-4 h-4" />}
                error={passwordForm.formState.errors.password?.message}
                {...passwordForm.register('password')}
              />

              <Input
                label="Confirmar senha"
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                icon={<Lock className="w-4 h-4" />}
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />

              <Button type="submit" loading={loading} className="w-full">
                Atualizar senha
              </Button>
            </form>
          ) : !sent ? (
            <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="bg-[#16120F] border border-stone-800/50 rounded-2xl p-8 space-y-5">
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
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />

              <Button type="submit" loading={loading} className="w-full">
                Enviar link de recuperação
              </Button>
            </form>
          ) : (
            <div className="bg-[#16120F] border border-stone-800/50 rounded-2xl p-8 text-center">
              <p className="text-stone-400 mb-4">
                Enviamos um link de recuperação para o seu email. Clique no link para definir uma nova senha.
              </p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Enviar novamente
              </Button>
            </div>
          )}

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
