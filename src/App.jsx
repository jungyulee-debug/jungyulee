import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import ideaLoopGif from './assets/idea-loop.gif'
import ideaStillGif from './assets/idea-still.gif'
import { createIdea, deleteIdea, getIdeas, updateIdea } from './ideasApi'
import './App.css'

const MAX_LENGTH = 280
const GIF_PLAY_TIME = 1600

function formatDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '방금'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function App() {
  const [draft, setDraft] = useState('')
  const [ideas, setIdeas] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isGifPlaying, setIsGifPlaying] = useState(false)
  const [gifRun, setGifRun] = useState(0)
  const gifTimerRef = useRef(null)

  useEffect(() => {
    let isActive = true

    async function loadBoard() {
      try {
        setErrorMessage('')
        const loadedIdeas = await getIdeas()
        if (isActive) {
          setIdeas(loadedIdeas)
        }
      } catch {
        if (isActive) {
          setErrorMessage('아이디어를 불러오지 못했습니다.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadBoard()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (gifTimerRef.current) {
        clearTimeout(gifTimerRef.current)
      }
    }
  }, [])

  const draftText = draft.trim()
  const editingValue = editingText.trim()
  const boardGifSrc = isGifPlaying ? `${ideaLoopGif}?run=${gifRun}` : ideaStillGif

  function playBoardGif() {
    if (gifTimerRef.current) {
      clearTimeout(gifTimerRef.current)
    }

    setIsGifPlaying(true)
    setGifRun((currentRun) => currentRun + 1)
    gifTimerRef.current = setTimeout(() => {
      setIsGifPlaying(false)
      gifTimerRef.current = null
    }, GIF_PLAY_TIME)
  }

  async function handleCreate(event) {
    event.preventDefault()

    if (!draftText) return

    try {
      setErrorMessage('')
      const newIdea = await createIdea(draftText)
      setIdeas((currentIdeas) => [newIdea, ...currentIdeas])
      setDraft('')
      playBoardGif()
    } catch {
      setErrorMessage('아이디어를 저장하지 못했습니다.')
    }
  }

  function startEditing(idea) {
    setEditingId(idea.id)
    setEditingText(idea.content)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingText('')
  }

  async function saveEditing(id) {
    if (!editingValue) return

    try {
      setErrorMessage('')
      const editedIdea = await updateIdea(id, editingValue)
      setIdeas((currentIdeas) =>
        currentIdeas.map((idea) => (idea.id === id ? editedIdea : idea)),
      )
      cancelEditing()
    } catch {
      setErrorMessage('아이디어를 수정하지 못했습니다.')
    }
  }

  async function handleDeleteIdea(id) {
    try {
      setErrorMessage('')
      await deleteIdea(id)
      setIdeas((currentIdeas) => currentIdeas.filter((idea) => idea.id !== id))

      if (editingId === id) {
        cancelEditing()
      }
    } catch {
      setErrorMessage('아이디어를 삭제하지 못했습니다.')
    }
  }

  return (
    <main className="app-shell">
      <header className="board-header">
        <div className="title-lockup">
          <div>
            <p className="eyebrow">Idea Card</p>
            <h1>아이디어 보드</h1>
          </div>
          <img
            className="board-gif"
            data-state={isGifPlaying ? 'playing' : 'idle'}
            src={boardGifSrc}
            alt="아이디어 애니메이션"
          />
        </div>
        <div className="idea-count" aria-label={`저장된 아이디어 ${ideas.length}개`}>
          {ideas.length}
        </div>
      </header>

      {errorMessage ? (
        <p className="status-message" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="composer" aria-label="새 아이디어 입력">
        <form onSubmit={handleCreate}>
          <label htmlFor="idea-input">새 아이디어</label>
          <div className="input-row">
            <textarea
              id="idea-input"
              value={draft}
              maxLength={MAX_LENGTH}
              placeholder="떠오른 생각을 적어보세요"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={!draftText}>
              <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
              저장
            </button>
          </div>
          <span className="character-count">
            {draft.length}/{MAX_LENGTH}
          </span>
        </form>
      </section>

      <section className="idea-board" aria-live="polite">
        {isLoading ? (
          <div className="empty-state">
            <h2>아이디어를 불러오는 중이에요</h2>
            <p>잠시만 기다려주세요.</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="empty-state">
            <h2>아직 저장된 아이디어가 없어요</h2>
            <p>첫 카드를 추가하면 이곳에 쌓입니다.</p>
          </div>
        ) : (
          ideas.map((idea) => {
            const isEditing = editingId === idea.id

            return (
              <article className="idea-card" key={idea.id}>
                <div className="card-topline">
                  <time dateTime={idea.updatedAt}>{formatDate(idea.updatedAt)}</time>
                  <div className="card-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="icon-button confirm"
                          type="button"
                          title="수정 저장"
                          aria-label="수정 저장"
                          disabled={!editingValue}
                          onClick={() => saveEditing(idea.id)}
                        >
                          <Check size={18} strokeWidth={2.4} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          title="수정 취소"
                          aria-label="수정 취소"
                          onClick={cancelEditing}
                        >
                          <X size={18} strokeWidth={2.4} aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="icon-button"
                          type="button"
                          title="아이디어 수정"
                          aria-label="아이디어 수정"
                          onClick={() => startEditing(idea)}
                        >
                          <Pencil size={17} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                        <button
                          className="icon-button danger"
                          type="button"
                          title="아이디어 삭제"
                          aria-label="아이디어 삭제"
                          onClick={() => handleDeleteIdea(idea.id)}
                        >
                          <Trash2 size={17} strokeWidth={2.3} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    className="edit-field"
                    value={editingText}
                    maxLength={MAX_LENGTH}
                    aria-label="아이디어 내용 수정"
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                ) : (
                  <p className="idea-content">{idea.content}</p>
                )}
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default App
