import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Helmet } from 'react-helmet-async'
import { User, Mail, Phone, Save } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function MemberProfile() {
  const { loading } = useRequireAuth()
  const { user, fetchProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq('id', user!.id)

      if (updateError) {
        setError(updateError.message || 'Erro ao atualizar perfil.')
      } else {
        setSuccess(true)
        await fetchProfile(user!.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão ao atualizar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return <PageLoader />

  return (
    <>
      <Helmet><title>Perfil | Envolve</title></Helmet>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Perfil</h1>
          <p className="text-stone-500 mt-1">Gerencie seus dados pessoais</p>
        </div>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xl font-bold">
              {user.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-[#F5E6C4]">{user.full_name}</p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {success && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                Perfil atualizado com sucesso!
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Nome completo"
              id="full_name"
              icon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label="Email"
              id="email"
              value={user.email}
              disabled
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Telefone"
              id="phone"
              placeholder="(00) 00000-0000"
              icon={<Phone className="w-4 h-4" />}
              {...register('phone')}
            />

            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4" /> Salvar alterações
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
