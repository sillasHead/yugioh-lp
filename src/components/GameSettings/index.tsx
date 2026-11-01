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
    profiles: Object.fromEntries(
      playerIds.map((id) => [id, { ...settings.profiles[id] }]),
    ),
  }))
  const [error, setError] = useState('')

  function updateProfile(
    playerId: string,
    field: 'name' | 'wins' | 'losses',
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
        profile.wins >= 0 &&
        Number.isSafeInteger(profile.losses) &&
        profile.losses >= 0
      )
    })

    if (!validPoints || !validProfiles) {
      setError('Informe valores inteiros válidos e um nome para cada jogador.')
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
          limpa o histórico de desfazer.
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
            <div className="settings-record-fields">
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
              <label className="settings-field">
                Derrotas
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.profiles[playerId]?.losses ?? 0}
                  onChange={(event) =>
                    updateProfile(playerId, 'losses', event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </fieldset>
        ))}

        <p className="settings-note">
          O placar também é atualizado quando a partida termina.
        </p>
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
