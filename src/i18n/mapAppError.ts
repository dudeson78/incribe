import type { TFunction } from 'i18next';

const MESSAGE_KEYS: Record<string, string> = {
  'Not authenticated': 'errors.notAuthenticated',
  'Verse not found': 'errors.verseNotFound',
  'Schedule not found': 'errors.scheduleNotFound',
  'Insert failed': 'errors.insertFailed',
  '구절을 찾을 수 없습니다.': 'errors.verseNotFound',
  /** Supabase Auth: 이메일 미인증 상태에서 로그인 시 */
  'Email not confirmed': 'errors.emailNotConfirmed',
};

/**
 * Supabase/PostgREST errors are normally `PostgrestError extends Error`,
 * but some RN/Hermes edge cases omit `instanceof`; still read `{ message }` 등.
 */
function coerceErrorParts(err: unknown): { message: string; detailLine: string } {
  const empty = () => ({ message: '', detailLine: '' });

  if (err == null) return empty();
  if (typeof err === 'string') return { message: err.trim(), detailLine: '' };

  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    const rawMsg =
      (typeof o.message === 'string' ? o.message : '') ||
      (err instanceof Error ? err.message : '');
    const message = typeof rawMsg === 'string' ? rawMsg.trim() : '';

    const details = typeof o.details === 'string' ? o.details.trim() : '';
    const hint = typeof o.hint === 'string' ? o.hint.trim() : '';
    const code = typeof o.code === 'string' ? o.code.trim() : '';

    const extras = [details, hint, code ? `code ${code}` : ''].filter(
      Boolean,
    );
    const detailLine = extras.join(' · ');

    if (message || detailLine) {
      return { message, detailLine };
    }
  }

  if (err instanceof Error && err.message?.trim()) {
    return { message: err.message.trim(), detailLine: '' };
  }

  try {
    const s = String(err).trim();
    return s ? { message: s, detailLine: '' } : empty();
  } catch {
    return empty();
  }
}

export function mapAppError(err: unknown, t: TFunction): string {
  const { message, detailLine } = coerceErrorParts(err);
  const key = MESSAGE_KEYS[message];
  if (key) {
    const main = t(key);
    return detailLine ? `${main}\n(${detailLine})` : main;
  }
  if (
    /\bEmail not confirmed\b/i.test(message) ||
    /\bemail_not_confirmed\b/i.test(detailLine) ||
    /\bemail_not_confirmed\b/i.test(message)
  ) {
    return t('errors.emailNotConfirmed');
  }
  if (
    /\brate limit\b/i.test(message) ||
    /\bover_email_send_rate_limit\b/i.test(detailLine) ||
    /\bover_email_send_rate_limit\b/i.test(message)
  ) {
    return t('errors.emailRateLimitExceeded');
  }
  if (
    /\blong_success_count\b/i.test(message) ||
    (/\bPGRST204\b/i.test(detailLine) &&
      /\breview_schedule\b/i.test(message))
  ) {
    return t('errors.reviewScheduleSchemaOutOfDate');
  }
  if (message) {
    return detailLine ? `${message}\n(${detailLine})` : message;
  }
  if (detailLine) {
    return detailLine;
  }
  return t('errors.unknown');
}
