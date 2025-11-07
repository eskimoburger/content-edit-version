import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import './App.css'

type Reward = {
  id: string
  title: string
  description: string
  icon: string
}

type HistoryEntry = {
  id: string
  cardNumber: number
  rewardTitle: string
  rewardIcon: string
  timestamp: number
}

const HISTORY_STORAGE_KEY = 'reward-history'

const HISTORY_LIMIT = 10

const rewards: Reward[] = [
  {
    id: 'mug',
    title: 'Devsmith Mug',
    description: 'Limited ceramic mug for your next caffeine boost.',
    icon: '☕️',
  },
  {
    id: 'coupon',
    title: 'Odoo Development Coupon',
    description: 'Apply this coupon toward premium Odoo build time.',
    icon: '🎟️',
  },
  {
    id: 'stickers',
    title: 'Sticker Set',
    description: 'A playful sticker pack to brighten every device.',
    icon: '✨',
  },
  {
    id: 'mystery',
    title: 'Mystery Add-on',
    description: 'An extra surprise that appears in your inbox.',
    icon: '🎁',
  },
]

const cardGridVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { when: 'beforeChildren', staggerChildren: 0.08 },
  },
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
} as const

const historyItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
} as const

function App() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [currentReward, setCurrentReward] = useState<Reward | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    'Pick one of the four cards below to begin.'
  )
  const [isDrawing, setIsDrawing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as HistoryEntry[]) : []
    } catch (error) {
      console.warn('Unable to load reward history from storage', error)
      return []
    }
  })

  const cards = useMemo(() => Array.from({ length: 4 }, (_, idx) => idx), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  }, [history])

  const handleCardSelect = (index: number) => {
    // If clicking the same card again, open it directly
    if (selectedCard === index) {
      handleDraw()
      return
    }

    // Otherwise, select the new card
    setSelectedCard(index)
    setCurrentReward(null)
    setStatusMessage('Click again to open, or choose another card.')
  }

  const handleDraw = () => {
    if (selectedCard === null) {
      setStatusMessage('Choose a card first to start the draw.')
      return
    }

    setIsDrawing(true)
    const reward = rewards[Math.floor(Math.random() * rewards.length)]
    setCurrentReward(reward)
    setStatusMessage(`You opened Card ${selectedCard + 1}!`)
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        cardNumber: selectedCard + 1,
        rewardTitle: reward.title,
        rewardIcon: reward.icon,
        timestamp: Date.now(),
      }
      const next = [entry, ...prev]
      return next.slice(0, HISTORY_LIMIT)
    })
    setIsModalOpen(true)
    setIsDrawing(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleClearHistory = () => {
    setHistory([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
  }

  return (
    <main className="reward-app">
      <header className="reward-header">
        <p className="eyebrow">Devsmith Rewards Lab</p>
        <h1>Spin, Draw, or Reveal</h1>
        <p>
          Four hidden cards are waiting. Select your favorite, then press the
          button to randomly unlock one of our featured rewards.
        </p>
      </header>

      <motion.section
        className="card-grid"
        aria-label="Reward cards"
        initial="hidden"
        animate="visible"
        variants={cardGridVariants}
      >
        {cards.map((cardIndex) => {
          const isSelected = selectedCard === cardIndex
          return (
            <motion.button
              key={cardIndex}
              className={`mystery-card${isSelected ? ' selected' : ''}`}
              type="button"
              onClick={() => handleCardSelect(cardIndex)}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: isSelected ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span className="card-number">Card {cardIndex + 1}</span>
              <span className="card-instruction">
                {isSelected ? 'Click to open' : 'Tap to choose'}
              </span>
            </motion.button>
          )
        })}
      </motion.section>

      <div className="actions">
        <motion.button
          type="button"
          className="draw-button"
          onClick={handleDraw}
          disabled={isDrawing || selectedCard === null}
          whileHover={
            isDrawing || selectedCard === null ? undefined : { scale: 1.05 }
          }
          whileTap={isDrawing || selectedCard === null ? undefined : { scale: 0.96 }}
          animate={{ opacity: isDrawing || selectedCard === null ? 0.6 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {isDrawing ? 'Drawing…' : 'Open Card'}
        </motion.button>
      </div>

      <section className="result-panel" aria-live="polite">
        <p className="status-message">{statusMessage}</p>
        <AnimatePresence mode="wait">
          {currentReward && (
            <motion.div
              key={currentReward.id}
              className="reward-result"
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <span className="reward-icon" aria-hidden="true">
                {currentReward.icon}
              </span>
              <div>
                <h2>{currentReward.title}</h2>
                <p>{currentReward.description}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="history-panel">
        <div className="history-header">
          <h2>Recent draws</h2>
          {history.length > 0 && (
            <button
              type="button"
              className="clear-history"
              onClick={handleClearHistory}
            >
              Clear history
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="history-empty">No draws yet. Your rewards will show up here.</p>
        ) : (
          <ol className="history-list">
            <AnimatePresence initial={false}>
              {history.map((entry) => (
                <motion.li
                  key={entry.id}
                  className="history-item"
                  layout
                  variants={historyItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <span className="history-icon" aria-hidden="true">
                    {entry.rewardIcon}
                  </span>
                  <div className="history-details">
                    <p className="history-title">{entry.rewardTitle}</p>
                    <p className="history-meta">
                      Card {entry.cardNumber} ·{' '}
                      {new Date(entry.timestamp).toLocaleString(undefined, {
                        hour: 'numeric',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && currentReward && (
          <motion.div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="reward-modal"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              <button
                type="button"
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Close reward dialog"
              >
                ×
              </button>
              <p className="modal-eyebrow">You earned</p>
              <h2 id="reward-modal-title">{currentReward.title}</h2>
              <span className="modal-icon" aria-hidden="true">
                {currentReward.icon}
              </span>
              <p>{currentReward.description}</p>
              <button
                type="button"
                className="modal-close-button"
                onClick={handleCloseModal}
              >
                Keep exploring
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default App
