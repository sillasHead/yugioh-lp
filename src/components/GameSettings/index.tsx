import { useState } from 'react'
import type { FormEvent } from 'react'
import { useGameLife } from '../../hooks/LifeContext'
import type { GameSettings } from '../../types/life-provider'
import './style.css'

type Props = {
  playerIds: string[]
  onClose: () => void
}

export function GameSettings({ playerIds, onClose }: Props) {
  const { saveSettings, settings } = useGameLife()
  const [draft, setDraft] = useState<GameSettings>(() => ({
    initialLifePoints: settings.initialLifePoints,
    rollMode: settings.rollMode,
    profiles: Object.fromEntries(
      playerIds.map((id) => [id, { ...settings.profiles[id] }]),
    ),
  }))
  const [error, setError] = useState('')

  function updateProfile(
    playerId: string,
    field: 'name' | 'wins',
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      profiles: {
        ...current.profiles,
        [playerId]: {
          ...current.profiles[playerId],
          [field]: field === 'name' ? value : Number(value),
        },
      },
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validPoints =
      Number.isSafeInteger(draft.initialLifePoints) &&
      draft.initialLifePoints > 0
    const validProfiles = playerIds.every((id) => {
      const profile = draft.profiles[id]
      return (
        profile.name.trim().length > 0 &&
        Number.isSafeInteger(profile.wins) &&
        profile.wins >= 0
      )
    })

    if (!validPoints || !validProfiles) {
      setError('Informe um nome e uma quantidade de vitórias válida para cada jogador.')
      return
    }

    saveSettings({
      ...draft,
      profiles: Object.fromEntries(
        playerIds.map((id) => [
          id,
          { ...draft.profiles[id], name: draft.profiles[id].name.trim() },
        ]),
      ),
    })
    onClose()
  }

  return (
    <div
      className="settings-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="settings-panel" onSubmit={submit}>
        <div className="settings-heading">
          <h2>Configurações da partida</h2>
          <button type="button" className="settings-close" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <label className="settings-field">
          LP iniciais para os dois jogadores
          <input
            type="number"
            min="1"
            step="1"
            value={draft.initialLifePoints}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                initialLifePoints: Number(event.target.value),
              }))
            }
            required
          />
        </label>
        <p className="settings-note">
          Alterar os LP iniciais reinicia os pontos atuais. Salvar configurações
          de LP ou jogadores limpa o histórico de desfazer.
        </p>

        {playerIds.map((playerId, index) => (
          <fieldset className="settings-player" key={playerId}>
            <legend>Jogador {index + 1}</legend>
            <label className="settings-field">
              Nome
              <input
                type="text"
                maxLength={24}
                value={draft.profiles[playerId]?.name ?? ''}
                onChange={(event) =>
                  updateProfile(playerId, 'name', event.target.value)
                }
                required
              />
            </label>
            <label className="settings-field">
              Vitórias
              <input
                type="number"
                min="0"
                step="1"
                value={draft.profiles[playerId]?.wins ?? 0}
                onChange={(event) =>
                  updateProfile(playerId, 'wins', event.target.value)
                }
                required
              />
            </label>
          </fieldset>
        ))}

        <p className="settings-note">
          As vitórias são registradas ao terminar uma partida e podem ser ajustadas aqui.
        </p>
        <fieldset className="settings-roll-mode">
          <legend>Lançamento de moeda e dado</legend>
          <label>
            <input type="radio" name="roll-mode" value="quick"
              checked={draft.rollMode === 'quick'}
              onChange={() => setDraft((current) => ({ ...current, rollMode: 'quick' }))} />
            <span><strong>Rápido</strong><small>O resultado aparece junto ao botão e desaparece.</small></span>
          </label>
          <label>
            <input type="radio" name="roll-mode" value="arena"
              checked={draft.rollMode === 'arena'}
              onChange={() => setDraft((current) => ({ ...current, rollMode: 'arena' }))} />
            <span><strong>Arena</strong><small>A tela escurece e você pode lançar várias vezes.</small></span>
          </label>
        </fieldset>
        {error && <p className="settings-error">{error}</p>}
        <div className="settings-footer">
          <button type="button" className="settings-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="settings-save">
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
