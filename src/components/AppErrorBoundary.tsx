import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../theme/colors';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** 런타임 오류 시 흰 화면 대신 원인 메시지를 보여 준다. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Inscribe] render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>앱을 불러오지 못했습니다</Text>
          <Text style={styles.hint}>
            아래 오류를 확인한 뒤 새로고침해 주세요.
          </Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.body} selectable>
              {this.state.error.message}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  hint: {
    fontSize: typography.min,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  scroll: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  scrollContent: {
    padding: 14,
  },
  body: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textPrimary,
  },
});
