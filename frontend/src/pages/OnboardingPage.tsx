import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../api/client';
import { saveStoredUser } from '../services/storage';
import { useSessionStore } from '../store/useSessionStore';

const emojis = ['😀', '😎', '🧠', '🎯', '🚀', '🛒'];

export function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😀');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const setUser = useSessionStore((s) => s.setUser);
  const navigate = useNavigate();

  async function submit(): Promise<void> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Indique o seu nome.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await api.post('/api/users/', {
        display_name: trimmed,
        avatar_emoji: avatarEmoji,
      });

      const user = {
        userId: response.data.id as string,
        displayName: response.data.display_name as string,
        avatarEmoji: response.data.avatar_emoji as string,
      };

      saveStoredUser(user);
      setUser(user);
      navigate('/home', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const details = status ? `HTTP ${status}` : err.message;
        setError(`Não foi possível criar o utilizador. ${details}`);
        return;
      }
      setError('Não foi possível criar o utilizador.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-ethereal onboarding-page">
      <div className="page-ethereal-inner">
        <div className="mb-4 flex w-full items-start justify-between gap-3">
          <p className="ethereal-muted mb-0">
            <Link to="/" className="ethereal-link">
              ← Voltar ao site
            </Link>
          </p>
          <ThemeToggle className="shrink-0" />
        </div>
        <h1 className="ethereal-title">Criar o seu perfil</h1>
        <p className="ethereal-subtitle">
          Escolha um nome e um emoji para começar a usar o ShopShare.
        </p>

        {error ? (
          <p className="ethereal-error" role="alert">
            {error}
          </p>
        ) : null}

        <label className="sr-only" htmlFor="display-name">
          O seu nome
        </label>
        <input
          id="display-name"
          className="ethereal-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="O seu nome"
          autoComplete="nickname"
        />

        <div className="ethereal-emoji-row" aria-label="Escolher emoji de avatar">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`ethereal-emoji-btn ${avatarEmoji === emoji ? 'ethereal-emoji-btn-active' : ''}`}
              onClick={() => setAvatarEmoji(emoji)}
              aria-pressed={avatarEmoji === emoji}
            >
              <span className="ethereal-emoji-char">{emoji}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="ethereal-submit"
          onClick={() => void submit()}
          disabled={submitting}
        >
          {submitting ? '…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
