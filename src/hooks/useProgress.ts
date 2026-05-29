import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface Task {
  id: string
  label: string
  completed: boolean
}

interface ProgressData {
  journeyActive: boolean
  watchedLectures: string[]
  tasks: Task[]
}

const defaultTasks: Task[] = [
  { id: 'qr_code', label: 'Ler QR Code de Ativação do Evento', completed: false },
  { id: 'whatsapp', label: 'Conectar ao Grupo VIP de Networking', completed: false },
  { id: 'materials', label: 'Baixar Modelo Oficial de TR (Termo de Referência)', completed: false },
]

async function fetchProgress(participantId: string): Promise<ProgressData | null> {
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('participant_id', participantId)
    .maybeSingle()

  if (!data) return null

  return {
    journeyActive: data.journey_active,
    watchedLectures: data.watched_lectures || [],
    tasks: defaultTasks.map((t) => ({
      ...t,
      completed: t.id === 'qr_code'
        ? data.journey_active
        : (data.completed_tasks as string[] || []).includes(t.id),
    })),
  }
}

async function upsertProgress(
  participantId: string,
  data: { journey_active?: boolean; watched_lectures?: string[]; completed_tasks?: string[] }
) {
  const existing = await supabase
    .from('user_progress')
    .select('id')
    .eq('participant_id', participantId)
    .maybeSingle()

  if (existing.data) {
    await supabase.from('user_progress').update(data).eq('participant_id', participantId)
  } else {
    await supabase.from('user_progress').insert({ participant_id: participantId, ...data })
  }
}

export function useProgress() {
  const { user } = useAuthStore()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [progress, setProgress] = useState<ProgressData>({
    journeyActive: false,
    watchedLectures: [],
    tasks: [...defaultTasks],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setParticipantId(data.id)
      })
  }, [user])

  useEffect(() => {
    if (!participantId) {
      setLoading(false)
      return
    }

    const loadFromLocal = (): ProgressData => {
      const active = localStorage.getItem(`journey_active_${user?.id}`) === 'true'
      const watched: string[] = JSON.parse(localStorage.getItem(`watched_lectures_${user?.id}`) || '[]')
      const completedTasks: string[] = JSON.parse(localStorage.getItem(`completed_tasks_${user?.id}`) || '[]')
      return {
        journeyActive: active,
        watchedLectures: watched,
        tasks: defaultTasks.map((t) => ({
          ...t,
          completed: t.id === 'qr_code' ? active : completedTasks.includes(t.id),
        })),
      }
    }

    fetchProgress(participantId).then((server) => {
      if (server) {
        setProgress(server)
        localStorage.setItem(`journey_active_${user?.id}`, String(server.journeyActive))
        localStorage.setItem(`watched_lectures_${user?.id}`, JSON.stringify(server.watchedLectures))
        const completed = server.tasks.filter((t) => t.completed && t.id !== 'qr_code').map((t) => t.id)
        localStorage.setItem(`completed_tasks_${user?.id}`, JSON.stringify(completed))
      } else {
        const local = loadFromLocal()
        setProgress(local)
        if (local.journeyActive || local.watchedLectures.length > 0) {
          upsertProgress(participantId, {
            journey_active: local.journeyActive,
            watched_lectures: local.watchedLectures,
            completed_tasks: local.tasks.filter((t) => t.completed && t.id !== 'qr_code').map((t) => t.id),
          })
        }
      }
      setLoading(false)
    })
  }, [participantId, user?.id])

  const syncToServer = useCallback(
    (updated: ProgressData) => {
      if (!participantId) return
      upsertProgress(participantId, {
        journey_active: updated.journeyActive,
        watched_lectures: updated.watchedLectures,
        completed_tasks: updated.tasks.filter((t) => t.completed && t.id !== 'qr_code').map((t) => t.id),
      })
      localStorage.setItem(`journey_active_${user?.id}`, String(updated.journeyActive))
      localStorage.setItem(`watched_lectures_${user?.id}`, JSON.stringify(updated.watchedLectures))
      const completed = updated.tasks.filter((t) => t.completed && t.id !== 'qr_code').map((t) => t.id)
      localStorage.setItem(`completed_tasks_${user?.id}`, JSON.stringify(completed))
    },
    [participantId, user?.id]
  )

  const setJourneyActive = useCallback(
    (active: boolean) => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          journeyActive: active,
          tasks: prev.tasks.map((t) =>
            t.id === 'qr_code' ? { ...t, completed: active } : t
          ),
        }
        syncToServer(updated)
        return updated
      })
    },
    [syncToServer]
  )

  const toggleWatched = useCallback(
    (lectureId: string) => {
      setProgress((prev) => {
        const watched = prev.watchedLectures.includes(lectureId)
          ? prev.watchedLectures.filter((id) => id !== lectureId)
          : [...prev.watchedLectures, lectureId]
        const updated = { ...prev, watchedLectures: watched }
        syncToServer(updated)
        return updated
      })
    },
    [syncToServer]
  )

  const toggleTask = useCallback(
    (taskId: string) => {
      if (taskId === 'qr_code') return
      setProgress((prev) => {
        const tasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
        const updated = { ...prev, tasks }
        syncToServer(updated)
        return updated
      })
    },
    [syncToServer]
  )

  const resetJourney = useCallback(() => {
    if (!participantId) return
    const empty: ProgressData = {
      journeyActive: false,
      watchedLectures: [],
      tasks: defaultTasks.map((t) => ({ ...t, completed: false })),
    }
    setProgress(empty)
    upsertProgress(participantId, {
      journey_active: false,
      watched_lectures: [],
      completed_tasks: [],
    })
    localStorage.removeItem(`journey_active_${user?.id}`)
    localStorage.removeItem(`watched_lectures_${user?.id}`)
    localStorage.removeItem(`completed_tasks_${user?.id}`)
  }, [participantId, user?.id])

  return { ...progress, loading, setJourneyActive, toggleWatched, toggleTask, resetJourney, participantId }
}
