import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal } from 'react-native';

import { MOTION_FADE_MS } from '../../theme/motion';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  durationMs?: number;
};

/** RN Modal 기본 fade 대신 200ms 커스텀 페이드 */
export function FadeModal({
  visible,
  onRequestClose,
  children,
  durationMs = MOTION_FADE_MS,
}: Props) {
  const [mounted, setMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: durationMs,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (!mounted) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, durationMs, mounted, opacity]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
    >
      <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>
    </Modal>
  );
}
