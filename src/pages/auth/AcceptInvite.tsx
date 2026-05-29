import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Helmet } from 'react-helmet-async'
import { Lock, ArrowRight } from 'lucide-react'

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function AcceptInvite() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    })

    if (updateError) {
      setError('Erro ao definir senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user) {
      await fetchProfile(sessionData.session.user.id)
      navigate('/app/dashboard', { replace: true })
    }

    setLoading(false)
  }

  return (
    <>
      <Helmet><title>Criar Conta | Envolve</title></Helmet>
      <div className="min-h-screen bg-[#0A0706] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A0706] font-black mx-auto mb-6">
              E
            </div>
            <h1 className="text-2xl font-bold text-[#F5E6C4]">Criar sua conta</h1>
            <p className="text-stone-500 mt-2">Defina sua senha para acessar a plataforma</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-[#16120F] border border-stone-800/50 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Senha"
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirmar senha"
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Criar conta e acessar <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
