import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { shadowSm, tokens } from '../../theme/tokens';

export type QuizSurfaceMode = 'reference' | 'blank' | 'order';

type Props = {
  active: QuizSurfaceMode;
  onChange: (m: QuizSurfaceMode) => void;
  labels: {
    reference: string;
    blank: string;
    order: string;
  };
};

const MODES: QuizSurfaceMode[] = ['reference', 'blank', 'order'];
const TRACK_PADDING = 4;

const MODE_ACCENT: Record<QuizSurfaceMode, string> = {
  reference: tokens.color.primary,
  blank: tokens.color.accent,
  order: tokens.color.success,
};

export function QuizModeSelector({ active, onChange, labels }: Props) {
  const labelByMode: Record<QuizSurfaceMode, string> = {
    reference: labels.reference,
    blank: labels.blank,
    order: labels.order,
  };

  const [trackWidth, setTrackWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const activeIndex = MODES.indexOf(active);
  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - TRACK_PADDING * 2) / MODES.length
      : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    Animated.timing(slideX, {
      toValue: activeIndex * segmentWidth,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, segmentWidth, slideX]);

  return (
    <View
      style={styles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              transform: [{ translateX: slideX }],
            },
          ]}
        />
      ) : null}
      {MODES.map((mode) => {
        const on = active === mode;
        const title = labelByMode[mode];
        const accent = MODE_ACCENT[mode];
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={({ pressed }) => [
              styles.segment,
              pressed && !on && styles.segmentPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={title}
          >
            <Text
              style={[
                styles.label,
                on
                  ? { color: accent, fontWeight: '600' }
                  : styles.labelIdle,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    padding: TRACK_PADDING,
    borderRadius: tokens.radius.xl,
    backgroundColor: tokens.color.bgSecondary,
    marginTop: 4,
    marginBottom: 12,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: TRACK_PADDING,
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    ...shadowSm,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: tokens.fontSize.sm,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelIdle: {
    color: tokens.color.textMuted,
    fontWeight: '400',
  },
});
