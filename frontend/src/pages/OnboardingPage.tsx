import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../api/client';
import { saveStoredUser } from '../services/storage';
import { useSessionStore } from '../store/useSessionStore';
import { colors } from '../theme/colors';

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
      setError('Please enter your name.');
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
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const details = status ? `HTTP ${status}` : err.message;
        setError(`Failed to create user. ${details}`);
        return;
      }
      setError('Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page onboarding-page">
      <div className="page-inner">
        <h1 className="title" style={{ color: colors.textPrimary }}>
          Welcome to ShopShare
        </h1>
        <p className="subtitle" style={{ color: colors.textSecondary }}>
          Pick a name and an avatar to start.
        </p>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <label className="sr-only" htmlFor="display-name">
          Your name
        </label>
        <input
          id="display-name"
          className="text-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          autoComplete="nickname"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.cardBorder}`,
            color: colors.textPrimary,
          }}
        />

        <div className="emoji-row" aria-label="Choose avatar emoji">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`emoji-button ${avatarEmoji === emoji ? 'emoji-button-active' : ''}`}
              onClick={() => setAvatarEmoji(emoji)}
              aria-pressed={avatarEmoji === emoji}
            >
              <span className="emoji-char">{emoji}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => void submit()}
          disabled={submitting}
          style={{ backgroundColor: colors.primary, color: colors.textPrimary }}
        >
          {submitting ? '…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
