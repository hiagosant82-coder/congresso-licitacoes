import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useProgress } from '../../hooks/useProgress'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { Helmet } from 'react-helmet-async'
import { FileText, Video, Download, ExternalLink, Lock } from 'lucide-react'
import type { FileItem } from '../../types'

export default function MemberMaterials() {
  const { loading } = useRequireAuth()
  const { user } = useAuthStore()
  const { journeyActive } = useProgress()
  const [files, setFiles] = useState<FileItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  // Load materials files
  useEffect(() => {
    if (!user) return

    const load = async () => {
      const orgId = user.organization_id
      let visibleFiles: FileItem[] = []
      let assignedFiles: FileItem[] = []

      if (orgId) {
        const { data: vf } = await supabase
          .from('files')
          .select('*')
          .eq('organization_id', orgId)
          .eq('visible_to_all', true)
          .order('created_at', { ascending: false })

        if (vf) visibleFiles = vf as FileItem[]
      }

      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (participant) {
        const { data: accessEntries } = await supabase
          .from('file_access')
          .select('file_id')
          .eq('participant_id', participant.id)

        if (accessEntries && accessEntries.length > 0) {
          const fileIds = accessEntries.map((a) => a.file_id)
          const { data: af } = await supabase
            .from('files')
            .select('*')
            .in('id', fileIds)
            .order('created_at', { ascending: false })

          if (af) assignedFiles = af as FileItem[]
        }
      }

      const merged = new Map<string, FileItem>()
      for (const f of visibleFiles) merged.set(f.id, f)
      for (const f of assignedFiles) merged.set(f.id, f)

      setFiles(Array.from(merged.values()))
      setPageLoading(false)
    }

    load()
  }, [user?.id, user?.organization_id])

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  const typeIcon = (type: string) => {
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />
    if (type.startsWith('image/')) return <FileText className="w-5 h-5" />
    return <Download className="w-5 h-5" />
  }

  const categories = [...new Set(files.map((f) => f.category).filter(Boolean))]

  return (
    <>
      <Helmet><title>Materiais | Envolve</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto pb-10 relative">
        
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Central de Downloads & Modelos</h1>
          <p className="text-stone-500 mt-1">Acesse apresentações, PDFs de slides, templates de ETP, TR e checklists.</p>
        </div>

        {files.length === 0 ? (
          <EmptyState
            title="Nenhum material disponível"
            description="Os materiais serão liberados pela organização em breve."
          />
        ) : (
          <div className="relative">
            
            {/* Blurry locking filter overlay if journey not active */}
            {!journeyActive && (
              <div className="absolute inset-0 bg-[#0A0706]/40 backdrop-blur-[4px] rounded-3xl z-20 flex flex-col items-center justify-center text-center p-6 border border-stone-850 shadow-2xl min-h-[300px]">
                <div className="p-4 rounded-3xl bg-[#D4AF37]/5 border border-[#D4AF37]/15 inline-flex mb-4 animate-pulse">
                  <Lock className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg font-black text-[#F5E6C4] tracking-tight">Downloads Trancados</h3>
                <p className="text-sm text-stone-500 max-w-sm mt-2 leading-relaxed">
                  Para liberar o acesso a todos os slides de palestrantes, modelos oficiais de Estudo Técnico Preliminar (ETP) e Termos de Referência, escaneie o **QR Code de Credenciamento** na tela de Dashboard.
                </p>
                <div className="mt-4 p-3.5 bg-amber-950/20 border border-amber-500/10 rounded-2xl text-xs text-amber-400">
                  💡 O credenciamento é feito no primeiro dia na entrada física do congresso.
                </div>
              </div>
            )}

            {/* List Content */}
            <div className={`space-y-8 transition-all duration-300 ${!journeyActive ? 'filter blur-xs select-none pointer-events-none' : ''}`}>
              {(categories.length > 0 ? categories : ['Geral']).map((cat) => {
                const catFiles = cat === 'Geral' && categories.length === 0
                  ? files
                  : files.filter((f) => f.category === cat)

                if (catFiles.length === 0) return null

                return (
                  <div key={cat} className="space-y-3">
                    <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                      {cat}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catFiles.map((file) => (
                        <Card key={file.id} className="hover:border-[#D4AF37]/20 hover:shadow-[0_0_15px_rgba(212,175,55,0.02)] transition-all duration-300">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-[#0A0706] text-[#D4AF37] border border-stone-850">
                              {typeIcon(file.file_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-stone-200 text-sm truncate">
                                {file.name}
                              </h3>
                              {file.description && (
                                <p className="text-xs text-stone-500 mt-0.5 truncate leading-relaxed">
                                  {file.description}
                                </p>
                              )}
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-2.5 text-xs text-[#D4AF37] hover:underline font-bold uppercase tracking-wider"
                              >
                                {file.file_type.startsWith('video/') ? 'Assistir' : 'Baixar'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}
      </div>
    </>
  )
}
