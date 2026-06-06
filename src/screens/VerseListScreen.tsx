import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { EmptyStatePanel } from '../components/EmptyStatePanel';
import { AppButton } from '../components/ui/AppButton';
import { FadeModal } from '../components/ui/FadeModal';
import { VerseMetaCoachmark } from '../components/VerseMetaCoachmark';
import { VersePracticeHistoryTable } from '../components/VersePracticeHistoryTable';
import type { ReviewLogRow, VerseWithSchedule } from '../types/verses';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { useDialog } from '../context/DialogContext';
import { normalizeSchedule, useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import type { VersesStackParamList } from '../navigation/types';
import { colors, typography } from '../theme/colors';
import { verseTypography } from '../theme/fonts';
import { modalTheme } from '../theme/modal';
import { cardPadding, hitSlopComfortable, radius, screenPadding, touchTarget } from '../theme/layout';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<VersesStackParamList, 'VerseList'>;

export function VerseListScreen({ navigation }: Props) {
  // 안드로이드는 탭바가 화면에 겹쳐 떠서(absolute) 목록 맨 아래(가장 먼저 추가한) 구절이 가려질 수 있어 여유를 넉넉히 둔다.
  const tabScrollPadding = useBottomTabScrollPadding(56);
  const { t } = useTranslation();
  const dialog = useDialog();
  const {
    getAllVerses,
    getReviewLogsForVerseIds,
    deleteVerse,
    updateVerse,
  } = useVerses();
  const [rows, setRows] = useState<VerseWithSchedule[]>([]);
  const [logsByVerse, setLogsByVerse] = useState<
    Record<string, ReviewLogRow[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keywordModal, setKeywordModal] = useState<VerseWithSchedule | null>(
    null,
  );
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keywordSaving, setKeywordSaving] = useState(false);
  const [mnemonicsModal, setMnemonicsModal] =
    useState<VerseWithSchedule | null>(null);
  const [mnemonicsDraft, setMnemonicsDraft] = useState('');
  const [mnemonicsSaving, setMnemonicsSaving] = useState(false);
  const [remaModal, setRemaModal] = useState<VerseWithSchedule | null>(null);
  const [remaDraft, setRemaDraft] = useState('');
  const [remaSaving, setRemaSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllVerses();
      setRows(data);
      const ids = data.map((v) => v.id);
      const logs = await getReviewLogsForVerseIds(ids);
      setLogsByVerse(logs);
    } catch {
      setRows([]);
      setLogsByVerse({});
    } finally {
      setLoading(false);
    }
  }, [getAllVerses, getReviewLogsForVerseIds]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AppButton
          label={`+ ${t('verses.addButton')}`}
          onPress={() => navigation.navigate('VerseForm', {})}
          size="sm"
          fullWidth={false}
          style={styles.headerBtnWrap}
          accessibilityLabel={t('verses.headerAddA11y')}
        />
      ),
    });
  }, [navigation, t]);

  async function confirmDelete(id: string, refLabel: string) {
    const ok = await dialog.confirm({
      title: t('verses.deleteTitle'),
      message: t('verses.deleteConfirm', { ref: refLabel }),
      confirmText: t('verses.delete'),
      cancelText: t('verses.cancel'),
      destructive: true,
    });
    if (ok) void doDelete(id);
  }

  async function doDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteVerse(id);
      await load();
    } catch (e) {
      await dialog.alert({ title: t('errors.title'), message: mapAppError(e, t) });
    } finally {
      setDeletingId(null);
    }
  }

  const blocked =
    deletingId !== null ||
    keywordSaving ||
    mnemonicsSaving ||
    remaSaving;

  function openKeywords(v: VerseWithSchedule) {
    setKeywordDraft(v.keywords?.trim() ? (v.keywords ?? '') : '');
    setKeywordModal(v);
  }

  function closeKeywordModal() {
    if (keywordSaving) return;
    setKeywordModal(null);
  }

  async function saveKeywords() {
    if (!keywordModal) return;
    const raw = keywordDraft.trim();
    setKeywordSaving(true);
    try {
      await updateVerse(keywordModal.id, {
        keywords: raw.length > 0 ? raw : null,
      });
      await load();
      setKeywordModal(null);
    } catch (e) {
      await dialog.alert({ title: t('errors.title'), message: mapAppError(e, t) });
    } finally {
      setKeywordSaving(false);
    }
  }

  function openMnemonics(v: VerseWithSchedule) {
    setMnemonicsDraft(v.mnemonics?.trim() ? (v.mnemonics ?? '') : '');
    setMnemonicsModal(v);
  }

  function closeMnemonicsModal() {
    if (mnemonicsSaving) return;
    setMnemonicsModal(null);
  }

  async function saveMnemonics() {
    if (!mnemonicsModal) return;
    const raw = mnemonicsDraft.trim();
    setMnemonicsSaving(true);
    try {
      await updateVerse(mnemonicsModal.id, {
        mnemonics: raw.length > 0 ? raw : null,
      });
      await load();
      setMnemonicsModal(null);
    } catch (e) {
      await dialog.alert({ title: t('errors.title'), message: mapAppError(e, t) });
    } finally {
      setMnemonicsSaving(false);
    }
  }

  function openRema(v: VerseWithSchedule) {
    setRemaDraft(v.rema?.trim() ? (v.rema ?? '') : '');
    setRemaModal(v);
  }

  function closeRemaModal() {
    if (remaSaving) return;
    setRemaModal(null);
  }

  async function saveRema() {
    if (!remaModal) return;
    const raw = remaDraft.trim();
    setRemaSaving(true);
    try {
      await updateVerse(remaModal.id, {
        rema: raw.length > 0 ? raw : null,
      });
      await load();
      setRemaModal(null);
    } catch (e) {
      await dialog.alert({ title: t('errors.title'), message: mapAppError(e, t) });
    } finally {
      setRemaSaving(false);
    }
  }

  const renderItem: ListRenderItem<VerseWithSchedule> = ({ item, index }) => {
    const n = index + 1;
    const schedule = normalizeSchedule(item);
    return (
      <View style={styles.row}>
        <View style={styles.oliveBar} />
        <View style={styles.rowInner}>
        <View style={styles.refRow}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>{n}</Text>
          </View>
          <Text style={styles.ref} numberOfLines={2}>
            {item.reference}
          </Text>
        </View>
        <View style={styles.snippetBox}>
          <Text style={styles.snippet}>{item.text}</Text>
        </View>
        {schedule ? (
          <VersePracticeHistoryTable
            verse={item}
            schedule={schedule}
            logs={logsByVerse[item.id] ?? []}
          />
        ) : null}
          <View style={styles.refActions}>
            <Pressable
              onPress={() =>
                navigation.navigate('VerseForm', { verseId: item.id })
              }
              style={({ pressed }) => [
                styles.actionTextBtn,
                styles.editBtn,
                pressed && styles.keywordBtnPressed,
                (blocked || deletingId === item.id) && styles.actionBtnDisabled,
              ]}
              accessibilityLabel={t('verses.a11yEdit', {
                ref: item.reference,
              })}
              accessibilityRole="button"
              hitSlop={hitSlopComfortable}
              disabled={blocked || deletingId === item.id}
            >
              <Text style={styles.editBtnText} numberOfLines={1}>
                {t('verses.edit')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void confirmDelete(item.id, item.reference)}
              style={({ pressed }) => [
                styles.actionTextBtn,
                styles.deleteBtn,
                pressed && styles.keywordBtnPressed,
                blocked && styles.actionBtnDisabled,
              ]}
              accessibilityLabel={t('verses.a11yDelete', {
                ref: item.reference,
              })}
              accessibilityRole="button"
              hitSlop={hitSlopComfortable}
              disabled={blocked}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color={colors.errorBorder} />
              ) : (
                <Text style={styles.deleteBtnText} numberOfLines={1}>
                  {t('verses.delete')}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => openKeywords(item)}
              style={({ pressed }) => [
                styles.keywordBtn,
                pressed && styles.keywordBtnPressed,
                blocked && styles.keywordBtnDisabled,
              ]}
              accessibilityLabel={t('verses.keywordA11y', {
                ref: item.reference,
              })}
              accessibilityRole="button"
              hitSlop={hitSlopComfortable}
              disabled={blocked}
            >
              <Text
                style={[
                  styles.keywordBtnText,
                  blocked && styles.keywordBtnTextDisabled,
                ]}
                numberOfLines={1}
              >
                {t('verses.keyword')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => openMnemonics(item)}
              style={({ pressed }) => [
                styles.keywordBtn,
                pressed && styles.keywordBtnPressed,
                blocked && styles.keywordBtnDisabled,
              ]}
              accessibilityLabel={t('verses.mnemonicsA11y', {
                ref: item.reference,
              })}
              accessibilityRole="button"
              hitSlop={hitSlopComfortable}
              disabled={blocked}
            >
              <Text
                style={[
                  styles.keywordBtnText,
                  blocked && styles.keywordBtnTextDisabled,
                ]}
                numberOfLines={1}
              >
                {t('verses.mnemonics')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => openRema(item)}
              style={({ pressed }) => [
                styles.keywordBtn,
                pressed && styles.keywordBtnPressed,
                blocked && styles.keywordBtnDisabled,
              ]}
              accessibilityLabel={t('verses.remaA11y', {
                ref: item.reference,
              })}
              accessibilityRole="button"
              hitSlop={hitSlopComfortable}
              disabled={blocked}
            >
              <Text
                style={[
                  styles.keywordBtnText,
                  blocked && styles.keywordBtnTextDisabled,
                ]}
                numberOfLines={1}
              >
                {t('verses.rema')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.forest} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={<VerseMetaCoachmark />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabScrollPadding },
        ]}
        ListEmptyComponent={
          <EmptyStatePanel
            variant="scroll"
            title={t('verses.emptyTitle')}
            body={t('verses.emptyBody')}
          />
        }
      />

      <FadeModal
        visible={keywordModal !== null}
        onRequestClose={closeKeywordModal}
      >
        <KeyboardAvoidingView
          style={styles.keywordModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.keywordModalDismiss} onPress={closeKeywordModal} />
          <View style={styles.keywordModalCard}>
            <Text style={styles.keywordModalTitle}>
              {t('verses.keywordModalTitle')}
            </Text>
            <Text style={styles.keywordModalHint}>
              {t('verses.keywordModalHint')}
            </Text>
            {keywordModal ? (
              <Text style={styles.keywordModalRef} numberOfLines={2}>
                {keywordModal.reference}
              </Text>
            ) : null}
            {keywordModal ? (
              <ScrollView
                style={styles.keywordModalBodyScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <Text style={styles.keywordModalBodyText} selectable>
                  {(keywordModal.text ?? '').trim().length > 0
                    ? keywordModal.text
                    : '—'}
                </Text>
              </ScrollView>
            ) : null}
            <TextInput
              style={styles.keywordInput}
              value={keywordDraft}
              onChangeText={setKeywordDraft}
              placeholder={t('verses.keywordPlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              editable={!keywordSaving}
              autoCorrect={false}
            />
            <View style={styles.keywordModalBtns}>
              <AppButton
                label={t('verses.keywordCancel')}
                onPress={closeKeywordModal}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={keywordSaving}
              />
              <AppButton
                label={t('verses.keywordClear')}
                onPress={() => setKeywordDraft('')}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={keywordSaving}
              />
              <AppButton
                label={t('verses.keywordSave')}
                onPress={() => void saveKeywords()}
                loading={keywordSaving}
                size="md"
                fullWidth={false}
                style={styles.modalSaveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </FadeModal>

      <FadeModal
        visible={mnemonicsModal !== null}
        onRequestClose={closeMnemonicsModal}
      >
        <KeyboardAvoidingView
          style={styles.keywordModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.keywordModalDismiss}
            onPress={closeMnemonicsModal}
          />
          <View style={styles.keywordModalCard}>
            <Text style={styles.keywordModalTitle}>
              {t('verses.mnemonicsModalTitle')}
            </Text>
            <Text style={styles.keywordModalHint}>
              {t('verses.mnemonicsModalHint')}
            </Text>
            {mnemonicsModal ? (
              <Text style={styles.keywordModalRef} numberOfLines={2}>
                {mnemonicsModal.reference}
              </Text>
            ) : null}
            {mnemonicsModal ? (
              <ScrollView
                style={styles.keywordModalBodyScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <Text style={styles.keywordModalBodyText} selectable>
                  {(mnemonicsModal.text ?? '').trim().length > 0
                    ? mnemonicsModal.text
                    : '—'}
                </Text>
              </ScrollView>
            ) : null}
            <TextInput
              style={styles.keywordInput}
              value={mnemonicsDraft}
              onChangeText={setMnemonicsDraft}
              placeholder={t('verses.mnemonicsPlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              editable={!mnemonicsSaving}
              autoCorrect={false}
            />
            <View style={styles.keywordModalBtns}>
              <AppButton
                label={t('verses.mnemonicsCancel')}
                onPress={closeMnemonicsModal}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={mnemonicsSaving}
              />
              <AppButton
                label={t('verses.mnemonicsClear')}
                onPress={() => setMnemonicsDraft('')}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={mnemonicsSaving}
              />
              <AppButton
                label={t('verses.mnemonicsSave')}
                onPress={() => void saveMnemonics()}
                loading={mnemonicsSaving}
                size="md"
                fullWidth={false}
                style={styles.modalSaveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </FadeModal>

      <FadeModal
        visible={remaModal !== null}
        onRequestClose={closeRemaModal}
      >
        <KeyboardAvoidingView
          style={styles.keywordModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.keywordModalDismiss}
            onPress={closeRemaModal}
          />
          <View style={styles.keywordModalCard}>
            <Text style={styles.keywordModalTitle}>
              {t('verses.remaModalTitle')}
            </Text>
            <Text style={styles.keywordModalHint}>
              {t('verses.remaModalHint')}
            </Text>
            {remaModal ? (
              <Text style={styles.keywordModalRef} numberOfLines={2}>
                {remaModal.reference}
              </Text>
            ) : null}
            {remaModal ? (
              <ScrollView
                style={styles.keywordModalBodyScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <Text style={styles.keywordModalBodyText} selectable>
                  {(remaModal.text ?? '').trim().length > 0
                    ? remaModal.text
                    : '—'}
                </Text>
              </ScrollView>
            ) : null}
            <TextInput
              style={styles.keywordInput}
              value={remaDraft}
              onChangeText={setRemaDraft}
              placeholder={t('verses.remaPlaceholder')}
              placeholderTextColor={colors.muted}
              multiline
              editable={!remaSaving}
              autoCorrect={false}
            />
            <View style={styles.keywordModalBtns}>
              <AppButton
                label={t('verses.remaCancel')}
                onPress={closeRemaModal}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={remaSaving}
              />
              <AppButton
                label={t('verses.remaClear')}
                onPress={() => setRemaDraft('')}
                variant="ghost"
                size="md"
                fullWidth={false}
                disabled={remaSaving}
              />
              <AppButton
                label={t('verses.remaSave')}
                onPress={() => void saveRema()}
                loading={remaSaving}
                size="md"
                fullWidth={false}
                style={styles.modalSaveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </FadeModal>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: screenPadding,
    flexGrow: 1,
  },
  headerBtnWrap: {
    marginRight: 6,
  },
  modalSaveBtn: {
    minWidth: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.parchment,
    borderRadius: radius.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    overflow: 'hidden',
  },
  oliveBar: {
    width: 4,
    backgroundColor: colors.forest,
  },
  rowInner: {
    flex: 1,
    minWidth: 0,
    padding: cardPadding,
    gap: 10,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: radius.lg,
    backgroundColor: colors.circleNumBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ref: {
    flex: 1,
    minWidth: 0,
    ...verseTypography.reference,
    fontSize: typography.min,
    lineHeight: 22,
  },
  refActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 4,
  },
  actionTextBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: touchTarget.min * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  editBtn: {
    borderColor: colors.forestTintBorder,
    backgroundColor: colors.forestTint,
  },
  editBtnText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteBtn: {
    borderColor: `${colors.errorBorder}80`,
    backgroundColor: `${colors.errorBorder}12`,
  },
  deleteBtnText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  keywordBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: `${colors.orange}99`,
    backgroundColor: `${colors.orange}14`,
    minHeight: touchTarget.min * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 88,
  },
  keywordBtnPressed: {
    opacity: 0.88,
  },
  keywordBtnDisabled: {
    opacity: 0.45,
    borderColor: `${colors.orange}44`,
  },
  keywordBtnText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  keywordBtnTextDisabled: {
    color: `${colors.textPrimary}99`,
  },
  keywordModalBackdrop: {
    ...modalTheme.shellTop,
  },
  keywordModalDismiss: {
    ...modalTheme.backdrop,
  },
  keywordModalCard: {
    ...modalTheme.card,
    maxHeight: '80%',
  },
  keywordModalTitle: {
    ...modalTheme.title,
    textAlign: 'left',
  },
  keywordModalHint: {
    ...modalTheme.hint,
  },
  keywordModalRef: {
    ...modalTheme.ref,
    textAlign: 'left',
  },
  keywordModalBodyScroll: {
    ...modalTheme.verseScroll,
  },
  keywordModalBodyText: {
    ...modalTheme.verseScrollText,
  },
  keywordInput: {
    minHeight: 88,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundPrimary,
    textAlignVertical: 'top',
  },
  keywordModalBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  snippetBox: {
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.pastelBlueBorderSoft,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  snippet: {
    ...verseTypography.body,
    color: colors.textPrimary,
  },
});
