import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MOTION_FADE_MS } from '../../theme/motion';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** false면 페이드 아웃 후 자식 유지(언마운트는 부모 책임) */
  visible?: boolean;
  durationMs?: number;
};

/** 마운트·visible 전환 시 opacity 0→1 (200ms 기본) */
export function FadeIn({
  children,
  style,
  visible = true,
  durationMs = MOTION_FADE_MS,
}: Props) {
  const opacity = useRef(new Animated.Value(visible ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: durationMs,
      useNativeDriver: true,
    }).start();
  }, [visible, durationMs, opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
  );
}
