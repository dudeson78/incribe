import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { VersePracticeHistoryTable } from '../components/VersePracticeHistoryTable';
import type { ReviewLogRow, VerseWithSchedule } from '../types/verses';
import { useBottomTabScrollPadding } from '../hooks/useBottomTabScrollPadding';
import { normalizeSchedule, useVerses } from '../hooks/useVerses';
import { mapAppError } from '../i18n/mapAppError';
import type { VersesStackParamList } from '../navigation/types';
import { colors, typography } from '../theme/colors';
import { hitSlopComfortable, touchTarget } from '../theme/layout';
import { useTranslation } from 'react-i18next';

/** 참조 줄과 무게 맞춤으로 작게 */
const REF_ICON_SZ = typography.caption + 2;

type Props = NativeStackScreenProps<VersesStackParamList, 'VerseList'>;

export function VerseListScreen({ navigation }: Props) {
  const tabScrollPadding = useBottomTabScrollPadding(32);
  const { t } = useTranslation();
  const {
    getAllVerses,
    getReviewLogsForVerseIds,
    deleteVerse,
    simulateShortCompleteMoveToLong,
    updateVerse,
  } = useVerses();
  const [rows, setRows] = useState<VerseWithSchedule[]>([]);
  const [logsByVerse, setLogsByVerse] = useState<
    Record<string, ReviewLogRow[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [longBusyId, setLongBusyId] = useState<string | null>(null);
  const [keywordModal, setKeywordModal] = useState<VerseWithSchedule | null>(
    null,
  );
  const [keywordDraft, setKeywordDraft] = useState('');
  const [keywordSaving, setKeywordSaving] = useState(false);

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
        <Pressable
          onPress={() => navigation.navigate('VerseForm', {})}
          style={styles.headerBtn}
          hitSlop={hitSlopComfortable}
          accessibilityLabel={t('verses.headerAddA11y')}
        >
          <Text style={styles.headerBtnText}>{t('verses.addButton')}</Text>
        </Pressable>
      ),
    });
  }, [navigation, t]);

  function confirmDelete(id: string, refLabel: string) {
    const title = t('verses.deleteTitle');
    const message = t('verses.deleteConfirm', { ref: refLabel });
    if (Platform.OS === 'web') {
      const ok =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(`${title}\n\n${message}`)
          : true;
      if (ok) void doDelete(id);
      return;
    }
    Alert.alert(title, message, [
      { text: t('verses.cancel'), style: 'cancel' },
      {
        text: t('verses.delete'),
        style: 'destructive',
        onPress: () => void doDelete(id),
      },
    ]);
  }

  async function doDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteVerse(id);
      await load();
      if (Platform.OS === 'web') {
        return;
      }
      Alert.alert(t('common.success'), t('verses.deleteSuccess'));
    } catch (e) {
      const body = mapAppError(e, t);
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('errors.title')}\n\n${body}`);
      } else {
        Alert.alert(t('errors.title'), body);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function doJumpToLong(id: string) {
    setLongBusyId(id);
    try {
      await simulateShortCompleteMoveToLong(id);
      await load();
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('common.success')}\n\n${t('verses.jumpToLongSuccess')}`);
        return;
      }
      Alert.alert(t('common.success'), t('verses.jumpToLongSuccess'));
    } catch (e) {
      const body = mapAppError(e, t);
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('errors.title')}\n\n${body}`);
      } else {
        Alert.alert(t('errors.title'), body);
      }
    } finally {
      setLongBusyId(null);
    }
  }

  function confirmJumpToLong(id: string) {
    const title = t('verses.jumpToLongTitle');
    const message = t('verses.jumpToLongMessage');
    const run = () => void doJumpToLong(id);
    if (Platform.OS === 'web') {
      const ok =
        typeof globalThis.confirm === 'function'
          ? globalThis.confirm(`${title}\n\n${message}`)
          : false;
      if (ok) run();
      return;
    }
    Alert.alert(title, message, [
      { text: t('verses.cancel'), style: 'cancel' },
      {
        text: t('verses.jumpToLongConfirm'),
        onPress: run,
      },
    ]);
  }

  const blocked =
    deletingId !== null ||
    longBusyId !== null ||
    keywordSaving;

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
      const body = mapAppError(e, t);
      if (Platform.OS === 'web') {
        globalThis.alert(`${t('errors.title')}\n\n${body}`);
      } else {
        Alert.alert(t('errors.title'), body);
      }
    } finally {
      setKeywordSaving(false);
    }
  }

  const renderItem: ListRenderItem<VerseWithSchedule> = ({ item, index }) => {
    const n = index + 1;
    const schedule = normalizeSchedule(item);
    return (
      <View style={styles.row}>
        <View style={styles.circle}>
          <Text style={styles.circleText}>{n}</Text>
        </View>
        <View style={styles.main}>
          <View style={styles.refRow}>
            <Text style={styles.ref} numberOfLines={2}>
              {item.reference}
            </Text>
            <View style={styles.refActions}>
              <Pressable
                onPress={() =>
                  navigation.navigate('VerseForm', { verseId: item.id })
                }
                style={({ pressed }) => [
                  styles.iconHit,
                  pressed && styles.iconHitPressed,
                ]}
                accessibilityLabel={t('verses.a11yEdit', {
                  ref: item.reference,
                })}
                accessibilityRole="button"
                hitSlop={hitSlopComfortable}
                disabled={blocked || deletingId === item.id}
              >
                <Ionicons
                  name="pencil-outline"
                  size={REF_ICON_SZ}
                  color={
                    blocked || deletingId === item.id
                      ? `${colors.forest}55`
                      : colors.forest
                  }
                />
              </Pressable>
              <Pressable
                onPress={() => confirmDelete(item.id, item.reference)}
                style={({ pressed }) => [
                  styles.iconHit,
                  pressed && styles.iconHitPressed,
                ]}
                accessibilityLabel={t('verses.a11yDelete', {
                  ref: item.reference,
                })}
                accessibilityRole="button"
                hitSlop={hitSlopComfortable}
                disabled={blocked}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.forest} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={REF_ICON_SZ}
                    color={
                      blocked ? `${colors.forest}55` : `${colors.forest}b3`
                    }
                  />
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
                onPress={() =>
                  confirmJumpToLong(item.id)}
                style={({ pressed }) => [
                  styles.jumpLongBtn,
                  pressed && styles.jumpLongBtnPressed,
                  (!schedule || blocked) && styles.jumpLongDisabled,
                ]}
                accessibilityLabel={t('verses.jumpToLongA11y', {
                  ref: item.reference,
                })}
                accessibilityRole="button"
                hitSlop={hitSlopComfortable}
                disabled={!schedule || blocked}
              >
                {longBusyId === item.id ? (
                  <ActivityIndicator size="small" color={colors.forest} />
                ) : (
                  <Text
                    style={[
                      styles.jumpLongText,
                      (!schedule || blocked) && styles.jumpLongTextDisabled,
                    ]}
                  >
                    {t('verses.jumpToLong')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
          <Text style={styles.snippet}>{item.text}</Text>
          {schedule ? (
            <VersePracticeHistoryTable
              verse={item}
              schedule={schedule}
              logs={logsByVerse[item.id] ?? []}
            />
          ) : null}
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
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabScrollPadding },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('verses.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('verses.emptyBody')}</Text>
          </View>
        }
      />

      <Modal
        visible={keywordModal !== null}
        transparent
        animationType="fade"
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
              <Pressable
                style={[styles.keywordModalGhost, keywordSaving && styles.keywordModalDisabled]}
                onPress={closeKeywordModal}
                disabled={keywordSaving}
              >
                <Text style={styles.keywordModalGhostTxt}>
                  {t('verses.keywordCancel')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.keywordModalGhost, keywordSaving && styles.keywordModalDisabled]}
                onPress={() => setKeywordDraft('')}
                disabled={keywordSaving}
              >
                <Text style={styles.keywordModalGhostTxt}>
                  {t('verses.keywordClear')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.keywordModalPri, keywordSaving && styles.keywordModalDisabled]}
                onPress={() => void saveKeywords()}
                disabled={keywordSaving}
              >
                {keywordSaving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.keywordModalPriTxt}>
                    {t('verses.keywordSave')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    padding: 16,
    flexGrow: 1,
  },
  headerBtn: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    gap: 12,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.circleNumBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '500',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  ref: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
    lineHeight: 22,
  },
  refActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingTop: 2,
  },
  iconHit: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconHitPressed: {
    opacity: 0.72,
  },
  jumpLongBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.forest}55`,
    backgroundColor: `${colors.forest}0f`,
    minWidth: 44,
    minHeight: touchTarget.min * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpLongBtnPressed: {
    opacity: 0.85,
  },
  jumpLongDisabled: {
    opacity: 0.45,
    borderColor: `${colors.forest}33`,
  },
  jumpLongText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.forest,
  },
  jumpLongTextDisabled: {
    color: `${colors.forest}99`,
  },
  keywordBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    color: colors.orange,
  },
  keywordBtnTextDisabled: {
    color: `${colors.orange}99`,
  },
  keywordModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,35,31,0.48)',
    justifyContent: 'center',
    padding: 22,
  },
  keywordModalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  keywordModalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: `${colors.forest}22`,
    gap: 10,
    zIndex: 1,
    maxHeight: '80%',
  },
  keywordModalTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.forest,
  },
  keywordModalRef: {
    fontSize: typography.min,
    fontWeight: '700',
    color: colors.forest,
    opacity: 0.92,
    lineHeight: 22,
  },
  keywordModalBodyScroll: {
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.creamBorder,
    backgroundColor: colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keywordModalBodyText: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  keywordInput: {
    minHeight: 88,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.forest,
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
  keywordModalGhost: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
    backgroundColor: colors.backgroundSecondary,
    minHeight: touchTarget.min * 0.75,
    justifyContent: 'center',
  },
  keywordModalGhostTxt: {
    fontSize: typography.min,
    fontWeight: '600',
    color: colors.forest,
  },
  keywordModalPri: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.forest,
    minHeight: touchTarget.min * 0.75,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keywordModalPriTxt: {
    fontSize: typography.min,
    fontWeight: '800',
    color: colors.white,
  },
  keywordModalDisabled: {
    opacity: 0.55,
  },
  snippet: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.forest,
    opacity: 0.85,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: typography.min,
    color: colors.muted,
    textAlign: 'center',
  },
});
