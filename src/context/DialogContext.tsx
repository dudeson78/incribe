import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../components/ui/AppButton';
import { colors, typography } from '../theme/colors';
import { radius } from '../theme/layout';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 파괴적 동작(삭제·초기화 등)이면 확인 버튼을 위험색으로 표시 */
  destructive?: boolean;
};

type AlertOptions = {
  title?: string;
  message: string;
  okText?: string;
};

type DialogState =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'alert'; opts: AlertOptions; resolve: () => void }
  | null;

export type DialogApi = {
  /** 확인/취소 두 버튼. 확인 시 true. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** 확인 버튼 하나. 닫히면 resolve. */
  alert: (opts: AlertOptions) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<DialogState>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: 'confirm', opts, resolve });
      }),
    [],
  );

  const alert = useCallback(
    (opts: AlertOptions) =>
      new Promise<void>((resolve) => {
        setDialog({ kind: 'alert', opts, resolve });
      }),
    [],
  );

  const close = useCallback((value: boolean) => {
    setDialog((cur) => {
      if (!cur) return null;
      const snapshot = cur;
      setTimeout(() => {
        if (snapshot.kind === 'confirm') snapshot.resolve(value);
        else snapshot.resolve();
      }, 0);
      return null;
    });
  }, []);

  const api = useMemo<DialogApi>(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog !== null ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => close(false)}
        >
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => close(false)}
            />
            <View style={styles.card}>
              <View style={styles.body}>
                {dialog.opts.title ? (
                  <Text style={styles.title}>{dialog.opts.title}</Text>
                ) : null}
                <Text style={styles.message}>{dialog.opts.message}</Text>
              </View>
              <View style={styles.actions}>
                {dialog.kind === 'confirm' ? (
                  <View style={styles.btnRow}>
                    <AppButton
                      label={
                        dialog.opts.cancelText ?? t('common.cancel')
                      }
                      onPress={() => close(false)}
                      variant="secondary"
                      size="md"
                      fullWidth={false}
                      style={styles.btnHalf}
                    />
                    <AppButton
                      label={
                        dialog.opts.confirmText ?? t('common.confirm')
                      }
                      onPress={() => close(true)}
                      variant={
                        dialog.opts.destructive ? 'danger' : 'primary'
                      }
                      size="md"
                      fullWidth={false}
                      style={styles.btnHalf}
                    />
                  </View>
                ) : (
                  <AppButton
                    label={dialog.opts.okText ?? t('common.ok')}
                    onPress={() => close(true)}
                    variant="primary"
                    size="md"
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.overlayBackdrop,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.cream,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    overflow: 'hidden',
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: typography.refLarge,
    fontWeight: '800',
    color: colors.forest,
    lineHeight: 28,
  },
  message: {
    fontSize: typography.min,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderTertiary,
    backgroundColor: colors.backgroundSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnHalf: {
    flex: 1,
  },
});
