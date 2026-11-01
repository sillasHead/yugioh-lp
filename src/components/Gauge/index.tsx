import { RefreshCcw } from 'lucide-react'
import gauge from '../../assets/gauge.png'
import { useLife } from '../../hooks/LifeContext'
import './style.css'

type Props = {
  playerDirection?: 'left' | 'right'
  playerId: string
  otherPlayer?: string
}

export function Gauge({
  playerDirection = 'left',
  playerId,
  otherPlayer,
}: Props) {
  const { displayedLifePoints, lifePointsPercentage, hit, heal, reset } =
    useLife(playerId)

  const otherPlayerLifePoints = useLife(otherPlayer || '').displayedLifePoints

  const lifeActions = [50, 100, 500, 1000]
  const scaleX = playerDirection === 'left' ? -1 : 1

  const victories = '1'.padStart(2, '0') // Placeholder for victories, can be replaced with actual logic

  function getResult() {
    if (otherPlayerLifePoints === 0) return 'win'
    if (displayedLifePoints === 0) return 'loser'
    return displayedLifePoints
  }

  return (
    <div className={`gauge-container ${playerId}`}>
      <div className="gauge" style={{ transform: `scaleX(${scaleX})` }}>
        <img src={gauge} alt="Gauge" />
        <div
          className="gauge-lp bungee-spice-regular"
          style={{
            transform: `scaleX(${scaleX})`,
          }}
        >
          {getResult()}
        </div>

        <div
          className="victories-counter sixtyfour-regular"
          style={{
            transform: `scaleX(${scaleX}) translateX(calc(30vw/-40))`,
          }}
        >
          Victories {victories}
        </div>

        <div className="gauge-bar">
          <div
            className="empty-bar"
            style={{
              height: `${100 - lifePointsPercentage}%`,
            }}
          />
          <div>
            <div className="bar bar-1" />
          </div>
          <div>
            <div className="bar bar-2" />
          </div>
          <div>
            <div className="bar bar-3" />
          </div>
          <div>
            <div className="bar bar-4" />
          </div>
          <div>
            <div className="bar bar-5" />
          </div>
          <div>
            <div className="bar bar-6" />
          </div>
          <div>
            <div className="bar bar-7" />
          </div>
          <div>
            <div className="bar bar-8" />
          </div>
        </div>
      </div>
      <div className="life-actions">
        {lifeActions.map((action) => (
          <button key={action} type="button" onClick={() => hit(action)}>
            💥 {action}
          </button>
        ))}
        {lifeActions
          .map((action) => (
            <button key={action} type="button" onClick={() => heal(action)}>
              💚 {action}
            </button>
          ))
          .reverse()}
        <button type="button" className="reset btn-gray" onClick={reset}>
          <RefreshCcw size={'1.25em'} />
        </button>
      </div>
    </div>
  )
}
