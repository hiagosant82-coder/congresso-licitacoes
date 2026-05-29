import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useProgress } from '../../hooks/useProgress'
import { useNotificationStore } from '../../stores/notificationStore'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Tabs from '../../components/ui/Tabs'
import EmptyState from '../../components/ui/EmptyState'
import { Helmet } from 'react-helmet-async'
import { 
  MapPin, 
  User, 
  PlayCircle, 
  Lock, 
  CheckCircle, 
  MessageSquare, 
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/utils'
import type { ScheduleItem } from '../../types'

interface Comment {
  id: string
  userName: string
  text: string
  createdAt: string
  avatarInitials: string
}

export default function MemberSchedule() {
  const { loading } = useRequireAuth()
  const { user } = useAuthStore()
  const { journeyActive, watchedLectures, toggleWatched, participantId } = useProgress()
  const notify = useNotificationStore((s) => s.add)
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [activeDay, setActiveDay] = useState<string>('1')
  const [expandedLectureId, setExpandedLectureId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newCommentText, setNewCommentText] = useState('')
  // Fetch schedules
  useEffect(() => {
    if (!user?.organization_id) return

    supabase
      .from('schedules')
      .select('*')
      .eq('organization_id', user.organization_id!)
      .order('day_number')
      .order('order_index')
      .then(({ data }) => {
        if (data) setItems(data as ScheduleItem[])
      })
  }, [user?.organization_id])

  // Fetch real comments from server
  const loadComments = useCallback(async () => {
    if (!participantId) return

    const scheduleIds = items.map((i) => i.id)
    if (scheduleIds.length === 0) return

    const { data } = await supabase
      .from('content_comments')
      .select('*, participants(full_name)')
      .in('schedule_item_id', scheduleIds)
      .order('created_at', { ascending: false })

    if (data) {
      const grouped: Record<string, Comment[]> = {}
      for (const c of data) {
        const pName = (c as any).participants?.full_name || 'Participante'
        if (!grouped[c.schedule_item_id]) grouped[c.schedule_item_id] = []
        grouped[c.schedule_item_id].push({
          id: c.id,
          userName: pName,
          text: c.text,
          createdAt: `Há ${Math.floor((Date.now() - new Date(c.created_at).getTime()) / 60000)} min`,
          avatarInitials: pName[0]?.toUpperCase() || 'P',
        })
      }
      setComments(grouped)
    }
  }, [participantId, items])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  if (loading || !user) return <PageLoader />

  const days = [...new Set(items.map((i) => i.day_number))].sort((a, b) => a - b)
  const filtered = items.filter((i) => i.day_number === Number(activeDay))

  const tabs = days.map((d) => ({
    key: String(d),
    label: `Dia ${d}`,
    count: items.filter((i) => i.day_number === d).length,
  }))

  const handlePostComment = async (lectureId: string) => {
    if (!newCommentText.trim() || !participantId || !user) return

    const { data, error } = await supabase.from('content_comments').insert({
      schedule_item_id: lectureId,
      participant_id: participantId,
      user_id: user.id,
      text: newCommentText.trim(),
    }).select().single()

    if (error) {
      notify('Erro ao publicar comentário.', 'error')
      return
    }

    const newComment: Comment = {
      id: data.id,
      userName: user.full_name || 'Participante',
      text: newCommentText.trim(),
      createdAt: 'Agora',
      avatarInitials: user.full_name?.[0]?.toUpperCase() || 'P',
    }

    setComments((prev) => ({
      ...prev,
      [lectureId]: [newComment, ...(prev[lectureId] || [])],
    }))
    setNewCommentText('')
    notify('Comentário publicado!', 'success')
  }

  const getLectureComments = (lectureId: string): Comment[] => {
    return comments[lectureId] || []
  }

  return (
    <>
      <Helmet><title>Programação | Envolve</title></Helmet>
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Programação & Replay</h1>
          <p className="text-stone-500 mt-1">
            Assista às palestras gravadas, comente e baixe os materiais de apoio exclusivos.
          </p>
        </div>

        {tabs.length > 1 && (
          <Tabs tabs={tabs} active={activeDay} onChange={setActiveDay} />
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="Programação em breve"
            description="A programação ainda não foi divulgada pela organização. Volte mais tarde!"
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const isExpanded = expandedLectureId === item.id
              const isWatched = watchedLectures.includes(item.id)
              const lectureComments = getLectureComments(item.id)

              return (
                <div 
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isExpanded 
                      ? 'border-[#D4AF37]/30 bg-[#120E0D] shadow-[0_0_20px_rgba(212,175,55,0.03)]' 
                      : 'border-stone-850 bg-[#0E0B0A] hover:border-stone-800'
                  }`}
                >
                  {/* Card Header (Main Info) */}
                  <div 
                    onClick={() => setExpandedLectureId(isExpanded ? null : item.id)}
                    className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex flex-col md:flex-row sm:items-start gap-4">
                      {/* Date and Time Badge */}
                      <div className="flex-shrink-0 text-center md:text-left min-w-[70px] p-2 rounded-xl bg-[#0A0706] border border-stone-850">
                        <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                          {item.start_time?.slice(0, 5)}
                        </p>
                        <p className="text-[10px] text-stone-500 font-bold mt-0.5">{formatDate(item.date)}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[#F5E6C4] tracking-tight">{item.title}</h3>
                          {isWatched && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> Assistida
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed">{item.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 pt-2">
                          {item.speaker && (
                            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                              <User className="w-3.5 h-3.5 text-[#D4AF37]" /> {item.speaker}
                            </span>
                          )}
                          {item.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                              <MapPin className="w-3.5 h-3.5" /> {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand Trigger Button */}
                    <div className="flex items-center justify-end">
                      <button className="p-2 rounded-xl bg-[#0A0706] hover:bg-[#161210] border border-stone-850 text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        {isExpanded ? (
                          <>Fechar <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Ver Vídeo & Slides <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subpage Detail Panels */}
                  {isExpanded && (
                    <div className="border-t border-stone-850 p-6 space-y-6 animate-fade-in">
                      
                      {/* Video Replay Panel */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Replay da Palestra</h4>
                        <div className="aspect-video w-full rounded-2xl bg-[#0A0706] border border-stone-850 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                          {/* Premium Video Background Placeholder */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                          <div className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xs" style={{ backgroundImage: "url('/assets/hero-v3-lSDBWtLS.jpg')" }} />
                          
                          <div className="z-20 text-center space-y-3 p-4">
                            <PlayCircle className="w-16 h-16 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300 cursor-pointer drop-shadow-lg" />
                            <p className="text-sm font-semibold text-stone-200">{item.title}</p>
                            <p className="text-xs text-stone-500">Replay gravado disponível em qualidade Full HD (1080p)</p>
                          </div>
                        </div>
                      </div>

                      {/* Checklist & Lecture Complete Panel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#181310] border border-stone-800/40">
                        <div>
                          <p className="text-xs font-bold text-stone-200">Gostaria de computar esta aula na sua evolução?</p>
                          <p className="text-[10px] text-stone-500 mt-0.5">Marcar como concluída ajudará a liberar o seu certificado.</p>
                        </div>
                        <button
                          onClick={() => toggleWatched(item.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                            isWatched
                              ? 'bg-emerald-500 text-[#0A0706]'
                              : 'bg-[#0A0706] text-[#D4AF37] border border-[#D4AF37]/35 hover:bg-[#D4AF37]/10'
                          }`}
                        >
                          {isWatched ? (
                            <><CheckCircle className="w-4 h-4" /> Concluída</>
                          ) : (
                            'Marcar como Concluída'
                          )}
                        </button>
                      </div>

                      {/* Two Columns Grid for Downloads and Comments */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-stone-850/50">
                        
                        {/* Downloads / Slides Attachment Panel */}
                        <div className="space-y-3 relative min-h-[160px]">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> Slides & Materiais de Apoio
                          </h4>

                          {!journeyActive ? (
                            // Locked Materials View
                            <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px] rounded-xl flex flex-col items-center justify-center text-center p-4 border border-stone-850 z-20">
                              <Lock className="w-8 h-8 text-[#D4AF37] mb-2 animate-pulse" />
                              <p className="text-xs font-bold text-stone-300">Materiais Trancados</p>
                              <p className="text-[10px] text-stone-500 max-w-[200px] mt-0.5">
                                Ative a jornada na Dashboard usando o QR Code para liberar os slides.
                              </p>
                            </div>
                          ) : (
                            // Unlocked Materials View
                            <Link
                              to="/app/materiais"
                              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-semibold transition-all"
                            >
                              <Download className="w-5 h-5" />
                              Acessar Central de Downloads
                            </Link>
                          )}
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-3 relative min-h-[220px]">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Espaço de Debates & Perguntas
                          </h4>

                          {!journeyActive ? (
                            // Locked Comments View
                            <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px] rounded-xl flex flex-col items-center justify-center text-center p-4 border border-stone-850 z-20">
                              <Lock className="w-8 h-8 text-[#D4AF37] mb-2 animate-pulse" />
                              <p className="text-xs font-bold text-stone-300">Comentários Bloqueados</p>
                              <p className="text-[10px] text-stone-500 max-w-[200px] mt-0.5">
                                Ative a jornada na Dashboard usando o QR Code para comentar nos vídeos.
                              </p>
                            </div>
                          ) : (
                            // Unlocked Comments View
                            <div className="space-y-4">
                              {/* Post Comment form */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newCommentText}
                                  onChange={(e) => setNewCommentText(e.target.value)}
                                  placeholder="Tire dúvidas ou debata com os colegas..."
                                  className="flex-1 bg-[#0A0706] border border-stone-800 rounded-xl px-4 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-[#D4AF37]/50"
                                />
                                <button
                                  onClick={() => handlePostComment(item.id)}
                                  disabled={!newCommentText.trim()}
                                  className="p-2 rounded-xl bg-[#D4AF37] hover:bg-[#Bfa030] text-[#0A0706] transition-colors disabled:opacity-30"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Comments List */}
                              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                                {lectureComments.map((c) => (
                                  <div key={c.id} className="p-3 rounded-xl bg-[#0A0706] border border-stone-850 flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-[10px] font-black">
                                      {c.avatarInitials}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-extrabold text-[#F5E6C4]">{c.userName}</span>
                                        <span className="text-[9px] text-stone-600 font-bold">{c.createdAt}</span>
                                      </div>
                                      <p className="text-stone-400 text-xs leading-relaxed break-words">{c.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
