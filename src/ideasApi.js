import { isSupabaseConfigured, supabase } from './supabaseClient'

const STORAGE_KEY = 'idea-card.ideas'
const TABLE_NAME = 'ideas'

function normalizeIdea(idea) {
  return {
    id: String(idea.id),
    content: idea.content,
    updatedAt: idea.updated_at ?? idea.updatedAt ?? new Date().toISOString(),
  }
}

function loadLocalIdeas() {
  try {
    const savedIdeas = localStorage.getItem(STORAGE_KEY)
    if (!savedIdeas) return []

    const parsedIdeas = JSON.parse(savedIdeas)
    if (!Array.isArray(parsedIdeas)) return []

    return parsedIdeas
      .filter((idea) => idea?.id && typeof idea.content === 'string')
      .map(normalizeIdea)
  } catch {
    return []
  }
}

function saveLocalIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
}

export async function getIdeas() {
  if (!isSupabaseConfigured) {
    return loadLocalIdeas()
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, content, updated_at')
    .order('updated_at', { ascending: false })

  if (error) throw error

  return data.map(normalizeIdea)
}

export async function createIdea(content) {
  const updatedAt = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const idea = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      content,
      updatedAt,
    }
    const ideas = [idea, ...loadLocalIdeas()]
    saveLocalIdeas(ideas)
    return idea
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ content, updated_at: updatedAt })
    .select('id, content, updated_at')
    .single()

  if (error) throw error

  return normalizeIdea(data)
}

export async function updateIdea(id, content) {
  const updatedAt = new Date().toISOString()

  if (!isSupabaseConfigured) {
    const ideas = loadLocalIdeas().map((idea) =>
      idea.id === id ? { ...idea, content, updatedAt } : idea,
    )
    saveLocalIdeas(ideas)
    return { id, content, updatedAt }
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ content, updated_at: updatedAt })
    .eq('id', id)
    .select('id, content, updated_at')
    .single()

  if (error) throw error

  return normalizeIdea(data)
}

export async function deleteIdea(id) {
  if (!isSupabaseConfigured) {
    saveLocalIdeas(loadLocalIdeas().filter((idea) => idea.id !== id))
    return
  }

  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)

  if (error) throw error
}
