import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCounterBoard, type CounterToken } from '../../hooks/CounterBoard'
import './style.css'

const PALETTE: CounterToken[] = [
  { id: 'star', symbol: '✦', color: '#ffd166', glow: '#ff9f1c' },
  { id: 'orb', symbol: '◉', color: '#8de4ff', glow: '#258bff' },
  { id: 'crystal', symbol: '◆', color: '#d6a8ff', glow: '#8b5cf6' },
  { id: 'flame', symbol: '♨', color: '#ff9079', glow: '#ff453a' },
  { id: 'leaf', symbol: '✿', color: '#91efad', glow: '#21b86b' },
  { id: 'moon', symbol: '☾', color: '#fff1a6', glow: '#d49b31' },
]

type Props = { playerId: string }

export function CounterRack({ playerId }: Props) {
  const board = useCounterBoard()
  const tokens = board.tokens(playerId).map(
    (token) => PALETTE.find(({ id }) => id === token.id) ?? token,
  )
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [removingTokens, setRemovingTokens] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isPickerOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsPickerOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPickerOpen])

  function removeTokenAfterExit(tokenId: string) {
    if (removingTokens.includes(tokenId)) return
    setRemovingTokens((current) => [...current, tokenId])
    window.setTimeout(() => {
      board.removeToken(playerId, tokenId)
      setRemovingTokens((current) => current.filter((id) => id !== tokenId))
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 380)
  }

  return (
    <div className="counter-rack">
      <div className="counter-rack-list" aria-label="Contadores do jogador">
        {tokens.map((token) => {
          const amount = board.count(playerId, token.id)
          return (
            <div className={`counter-rack-item${removingTokens.includes(token.id) ? ' is-removing' : ''}`} key={token.id}
              style={{ '--token-color': token.color, '--token-glow': token.glow } as CSSProperties}>
              <button
                className="counter-rack-minus"
                type="button"
                aria-label={`Remover um contador ${token.symbol}`}
                disabled={amount === 0 || removingTokens.includes(token.id)}
                onClick={() => board.changeCount(playerId, token.id, -1)}
              ><Minus size={13} /></button>
              <button
                className="counter-rack-value"
                type="button"
                aria-label={`Adicionar contador ${token.symbol}; total ${amount}`}
                disabled={removingTokens.includes(token.id)}
                onClick={() => board.changeCount(playerId, token.id, 1)}
              >
                <span>{token.symbol}</span><b>{amount}</b>
              </button>
            </div>
          )
        })}
      </div>
      {tokens.length > 0 && (
        <button
          className={`counter-rack-clear${tokens.length > 0 && removingTokens.length === tokens.length ? ' is-removing' : ''}`}
          type="button"
          aria-label="Remover todos os contadores deste jogador"
          title="Remover todos os contadores deste jogador"
          disabled={removingTokens.length > 0}
          onClick={() => tokens.forEach((token) => removeTokenAfterExit(token.id))}
        ><Trash2 size={15} /></button>
      )}
      <div className="counter-rack-picker-wrap" ref={pickerRef}>
        <button
          className={`counter-rack-add${isPickerOpen ? ' is-open' : ''}`}
          type="button"
          aria-label={isPickerOpen ? 'Fechar seletor de contadores' : 'Adicionar contador'}
          aria-expanded={isPickerOpen}
          onClick={() => setIsPickerOpen((open) => !open)}
        ><Plus size={17} /></button>
        {isPickerOpen && (
          <div className="counter-rack-picker" role="group" aria-label="Escolher contador">
            <span className="counter-rack-picker-title">CONTADORES</span>
            <div className="counter-rack-picker-options">
              {PALETTE.map((token) => {
                const exists = tokens.some(({ id }) => id === token.id)
                return (
                  <button
                    type="button"
                    key={token.id}
                    className={`counter-rack-option${exists ? ' is-added' : ''}`}
                    style={{ '--token-color': token.color, '--token-glow': token.glow } as CSSProperties}
                    aria-label={`${exists ? 'Remover' : 'Adicionar'} contador ${token.symbol}`}
                    title={exists ? 'Remover contador e sua quantidade' : 'Adicionar contador'}
                    onClick={() => {
                      if (exists) removeTokenAfterExit(token.id)
                      else board.addToken(playerId, token)
                    }}
                  >
                    <span>{token.symbol}</span>
                  </button>
                )
              })}
            </div>
            <span className="counter-rack-picker-hint">Toque para adicionar ou remover um contador</span>
          </div>
        )}
      </div>
    </div>
  )
}
