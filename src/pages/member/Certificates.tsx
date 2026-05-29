import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { Helmet } from 'react-helmet-async'
import { Award, Download } from 'lucide-react'

interface Certificate {
  id: string
  title: string
  description: string | null
  certificate_url: string | null
  issued: boolean
  issued_at: string | null
}

export default function MemberCertificates() {
  const { loading } = useRequireAuth()
  const { user } = useAuthStore()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!user?.organization_id) return

    const load = async () => {
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (participant) {
        const { data: certs } = await supabase
          .from('certificates')
          .select('*')
          .eq('participant_id', participant.id)
          .eq('organization_id', user.organization_id!)
          .order('created_at', { ascending: false })

        if (certs) setCertificates(certs)
      }
      setPageLoading(false)
    }

    load()
  }, [user?.organization_id, user?.id])

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  return (
    <>
      <Helmet><title>Certificados | Envolve</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Certificados</h1>
          <p className="text-stone-500 mt-1">Seus certificados de participação</p>
        </div>

        {certificates.length === 0 ? (
          <EmptyState
            title="Nenhum certificado disponível"
            description="Os certificados serão disponibilizados após o evento."
          />
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#0A0706] text-[#D4AF37]">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#F5E6C4]">{cert.title}</h3>
                      {cert.description && (
                        <p className="text-sm text-stone-500 mt-1">{cert.description}</p>
                      )}
                      <p className="text-xs text-stone-600 mt-2">
                        {cert.issued
                          ? `Emitido em ${cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('pt-BR') : 'data indisponível'}`
                          : 'Aguardando emissão'}
                      </p>
                    </div>
                  </div>
                  {cert.issued && cert.certificate_url && (
                    <a
                      href={cert.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#0A0706] rounded-xl text-sm font-semibold hover:bg-[#C4A030] transition-colors"
                    >
                      <Download className="w-4 h-4" /> Baixar
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
