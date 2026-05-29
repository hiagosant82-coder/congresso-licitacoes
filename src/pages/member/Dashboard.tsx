import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useProgress } from '../../hooks/useProgress'
import { useNotificationStore } from '../../stores/notificationStore'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card, { StatCard } from '../../components/ui/Card'
import { Helmet } from 'react-helmet-async'
import { 
  Calendar, 
  FileText, 
  Award, 
  Clock, 
  ChevronRight, 
  QrCode, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Compass, 
  ExternalLink,
  Download
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../lib/utils'
import type { ScheduleItem } from '../../types'

export default function MemberDashboard() {
  const { loading } = useRequireAuth()
  const { user } = useAuthStore()
  const { 
    journeyActive, watchedLectures, tasks, loading: progressLoading, 
    setJourneyActive, toggleTask, resetJourney 
  } = useProgress()
  const notify = useNotificationStore((s) => s.add)
  
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [filesCount, setFilesCount] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'success'>('idle')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const orgId = user.organization_id

      if (orgId) {
        const today = new Date().toISOString().split('T')[0]
        const { data: sched } = await supabase
          .from('schedules')
          .select('*')
          .eq('organization_id', orgId)
          .gte('date', today)
          .order('date')
          .order('start_time')
          .limit(5)

        if (sched) setSchedule(sched as ScheduleItem[])

        const { count } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('visible_to_all', true)

        if (count !== null) setFilesCount(count)
      }

      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (participant) {
        const { count: assignedCount } = await supabase
          .from('file_access')
          .select('*', { count: 'exact', head: true })
          .eq('participant_id', participant.id)

        if (assignedCount !== null) {
          setFilesCount((prev) => prev + assignedCount)
        }
      }
    }

    load()
  }, [user?.id, user?.organization_id])

  if (loading || !user) return <PageLoader />
  if (progressLoading) return <PageLoader />

  const handleStartScan = () => {
    setScanStep('scanning')
    setShowScanner(true)
    setTimeout(() => {
      setScanStep('success')
    }, 2500)
  }

  const handleCompleteActivation = () => {
    setJourneyActive(true)
    setShowScanner(false)
    setScanStep('idle')
    notify('Jornada ativada! Todos os materiais foram liberados.', 'success')
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }
  }

  const handleResetJourney = () => {
    if (window.confirm('Deseja resetar sua jornada e trancar o acesso novamente para testes?')) {
      resetJourney()
      notify('Jornada resetada.', 'info')
    }
  }

  const completedTaskCount = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const totalLectures = schedule.length || 5
  const completedLecturesCount = watchedLectures.length
  const taskProgress = totalTasks > 0 ? (completedTaskCount / totalTasks) * 40 : 0
  const lectureProgress = totalLectures > 0 ? (completedLecturesCount / totalLectures) * 60 : 0
  const overallProgress = Math.round(taskProgress + lectureProgress)

  return (
    <>
      <Helmet><title>Área do Cliente | Envolve</title></Helmet>
      
      {/* Dynamic styling for custom scanning animations */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-line {
          animation: scanLine 2s infinite ease-in-out;
        }
      `}</style>

      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        
        {/* Dynamic Premium Header with Accented Accent */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#181310] to-[#0A0706] border border-stone-800/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-xs font-semibold text-[#D4AF37] border border-[#D4AF37]/20 uppercase tracking-widest">
                3º Congresso de Licitações
              </span>
              {journeyActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Acesso Premium Ativo
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-[#F5E6C4] tracking-tight">
              Olá, {user.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-stone-400 text-sm">
              Seja bem-vindo ao portal oficial do Vale do Araguaia. Sua central de inteligência e aprendizado.
            </p>
          </div>
          
          {journeyActive && user.role === 'admin' && (
            <button 
              onClick={handleResetJourney}
              className="px-3 py-1.5 rounded-xl border border-stone-800 hover:border-red-500/30 text-stone-500 hover:text-red-400 text-xs font-medium transition-all"
            >
              Resetar Jornada (Testes)
            </button>
          )}
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            label="Próximas atividades"
            value={schedule.length || 'Carregando...'}
            icon={Calendar}
            trend="Programação oficial liberada"
          />
          <StatCard
            label="Arquivos & Documentos"
            value={journeyActive ? filesCount : '🔒 Acesso bloqueado'}
            icon={FileText}
            trend={journeyActive ? "Modelos prontos para download" : "Ative com o QR Code para liberar"}
          />
          <StatCard
            label="Certificado Digital"
            value={overallProgress === 100 ? "🟢 Disponível" : "⏳ Conclua a jornada"}
            icon={Award}
            trend={overallProgress === 100 ? "Liberado para download!" : `${100 - overallProgress}% restante`}
          />
        </div>

        {/* Interactive Progress & QR Activation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Progress Ring & Tasks Card (7 cols) */}
          <Card className="lg:col-span-7 !p-6 bg-gradient-to-b from-[#120E0C] to-[#0A0706] border-stone-800/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#F5E6C4] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#D4AF37]" /> Sua Evolução da Jornada
                </h2>
                <p className="text-stone-500 text-xs mt-1">Conclua as tarefas e palestras para gerar sua certificação.</p>
              </div>

              {/* Progress Ring Visual */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#0F0C0A] border border-stone-800/20">
                <div className="relative flex items-center justify-center min-w-[90px] h-[90px]">
                  {/* SVG Circle progress */}
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#1C1815" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#D4AF37" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - overallProgress / 100)}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span className="absolute text-lg font-black text-[#F5E6C4] tracking-tighter">
                    {overallProgress}%
                  </span>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-stone-200">
                    Progresso da Capacitação
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Palestras assistidas: <span className="text-[#D4AF37] font-bold">{completedLecturesCount} de {totalLectures}</span>. 
                    <br />
                    Tarefas e downloads obrigatórios: <span className="text-[#D4AF37] font-bold">{completedTaskCount} de {totalTasks}</span>.
                  </p>
                </div>
              </div>

              {/* Interactive Checklist */}
              <div className="space-y-3">
                <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">Tarefas do Evento</p>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        task.completed 
                          ? 'bg-[#0F140E] border-emerald-500/20 text-stone-400' 
                          : 'bg-[#0A0706] border-stone-800/40 text-stone-200 hover:border-stone-800'
                      } ${task.id === 'qr_code' ? 'cursor-default' : 'cursor-pointer select-none'}`}
                    >
                      <div className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-stone-850 hover:border-stone-800 flex-shrink-0" />
                        )}
                        <span className="text-xs md:text-sm font-medium">{task.label}</span>
                      </div>
                      
                      {task.id === 'whatsapp' && !task.completed && (() => {
                        const groupLink = import.meta.env.VITE_WHATSAPP_GROUP_LINK
                        return groupLink ? (
                          <a 
                            href={groupLink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold flex items-center gap-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id);
                            }}
                          >
                            Entrar <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-stone-800/40 text-stone-500 text-[10px] font-semibold flex items-center gap-1 cursor-default border border-stone-800/30">
                            Em breve
                          </span>
                        )
                      })()}
                      
                      {task.id === 'materials' && !task.completed && (
                        <Link 
                          to="/app/materiais" 
                          className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold flex items-center gap-1 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                        >
                          Ir para downloads <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* QR Code Journey Activation Card (5 cols) */}
          <Card className="lg:col-span-5 !p-6 bg-gradient-to-b from-[#120E0C] to-[#0A0706] border-stone-800/40 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full filter blur-2xl pointer-events-none" />
            
            {journeyActive ? (
              // Active State View
              <div className="h-full flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#F5E6C4] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" /> Jornada Ativa
                  </h2>
                  <p className="text-stone-500 text-xs mt-1">Sua participação presencial foi confirmada com sucesso!</p>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="w-36 h-36 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 p-4 text-center">
                    <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-wider">Credenciado!</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 text-xs leading-relaxed text-center">
                  🎉 Todos os materiais de downloads de modelos ETP, TR e as opções de comentários nos vídeos de replay já estão **100% liberados** na sua conta!
                </div>
              </div>
            ) : (
              // Locked State View
              <div className="h-full flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#F5E6C4] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#D4AF37]" /> Credenciamento Digital
                  </h2>
                  <p className="text-stone-500 text-xs mt-1">Escaneie o QR Code de entrada para destravar os benefícios.</p>
                </div>

                {/* Styled QR Mockup */}
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  {!showScanner ? (
                    <div className="relative group cursor-pointer" onClick={handleStartScan}>
                      <div className="absolute inset-0 bg-[#D4AF37]/5 rounded-2xl filter blur-xl group-hover:bg-[#D4AF37]/10 transition-all duration-300" />
                      <div className="w-32 h-32 rounded-2xl bg-[#16120F] border-2 border-[#D4AF37]/30 flex flex-col items-center justify-center text-stone-500 p-4 transition-all duration-300 group-hover:border-[#D4AF37] relative">
                        <QrCode className="w-16 h-16 text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Simular Scanner</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Live Scanning Simulation View
                    <div className="w-full max-w-[200px] aspect-square rounded-2xl bg-[#070504] border border-stone-850 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                      {scanStep === 'scanning' ? (
                        <>
                          <QrCode className="w-24 h-24 text-[#D4AF37]/20 animate-pulse" />
                          <div className="absolute left-0 right-0 h-1 bg-[#D4AF37] scanner-line opacity-80" />
                          <span className="text-[9px] text-[#D4AF37] uppercase font-black tracking-widest mt-2 animate-pulse">Escaneando...</span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-2 animate-fade-in">
                          <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                          <p className="text-xs font-bold text-stone-200">Sucesso!</p>
                          <button 
                            onClick={handleCompleteActivation}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0A0706] text-[10px] font-black uppercase tracking-wider shadow-lg transform active:scale-95 transition-all"
                          >
                            Destravar Acesso
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-amber-950/20 border border-amber-500/10 rounded-xl flex gap-3 text-xs text-amber-400/80 leading-relaxed">
                  <Lock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Downloads trancados!</strong>
                    <br /> 
                    Os modelos, checklists e seções de comentários em vídeo exigem a confirmação presencial via QR Code.
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Program and Downloads Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Lecture Program Card */}
          <Card className="!p-6 bg-gradient-to-b from-[#120E0C] to-[#0A0706] border-stone-800/40">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#F5E6C4] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" /> Atividades & Palestras
              </h2>
              <Link
                to="/app/programacao"
                className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Programação Completa <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {schedule.length === 0 ? (
              <p className="text-stone-500 text-sm py-4">A programação será liberada em breve.</p>
            ) : (
              <div className="space-y-3">
                {schedule.slice(0, 3).map((item) => {
                  const isWatched = watchedLectures.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        isWatched 
                          ? 'bg-[#0E0B09]/40 border-stone-850 opacity-60' 
                          : 'bg-[#0A0706] border-stone-800/30'
                      }`}
                    >
                      <div className="text-center min-w-[50px] p-1.5 rounded-lg bg-[#120E0C] border border-stone-850">
                        <p className="text-[10px] text-[#D4AF37] font-extrabold uppercase">
                          {formatDate(item.date)}
                        </p>
                        <p className="text-[10px] text-stone-500 font-bold">{item.start_time?.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-200 truncate">{item.title}</p>
                        {item.speaker && (
                          <p className="text-xs text-stone-500 truncate mt-0.5">{item.speaker}</p>
                        )}
                      </div>
                      {isWatched && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Assistida
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Premium Locked Materials Preview Card */}
          <Card className="!p-6 bg-gradient-to-b from-[#120E0C] to-[#0A0706] border-stone-800/40 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#F5E6C4] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" /> Central de Downloads
              </h2>
              <Link
                to="/app/materiais"
                className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Acessar Arquivos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {!journeyActive ? (
              // Locked View for Downloads Card
              <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-stone-800/50 rounded-2xl bg-black/30 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-[#0A0706]/40 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <Lock className="w-10 h-10 text-[#D4AF37] mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-stone-300">Downloads Trancados</p>
                  <p className="text-xs text-stone-500 max-w-[240px] mt-1 leading-relaxed">
                    Ative a sua jornada lendo o QR Code de entrada no primeiro dia do evento para destravar todos os modelos.
                  </p>
                </div>
              </div>
            ) : (
              // Unlocked View for Downloads Card
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <p className="text-stone-400 text-sm">
                  {filesCount > 0
                    ? `${filesCount} materiais de apoio e modelos estão totalmente disponíveis para download.`
                    : 'Os materiais exclusivos estão sendo disponibilizados pela equipe.'}
                </p>

                <Link
                  to="/app/materiais"
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-semibold transition-all"
                >
                  <Download className="w-5 h-5" />
                  Acessar Central de Downloads
                </Link>

                <div className="p-3.5 rounded-xl bg-[#0F0C0A] border border-stone-850 text-center">
                  <p className="text-[10px] text-stone-500">
                    💡 Dica: baixe os templates antes de começar as palestras práticas.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Notices Section */}
        <Card className="!p-6 bg-gradient-to-b from-[#120E0C] to-[#0A0706] border-stone-800/40">
          <h2 className="text-lg font-bold text-[#F5E6C4] mb-3">Painel de Avisos Oficial</h2>
          <div className="p-4 rounded-xl bg-[#0A0706] border border-stone-800/20">
            <p className="text-sm text-stone-400">
              📌 Abertura oficial das salas no dia 28/05 às 08:30 (Horário local). Lembre-se de portar seu documento oficial no credenciamento físico.
            </p>
          </div>
        </Card>

      </div>
    </>
  )
}
