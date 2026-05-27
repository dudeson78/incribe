import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radius, touchTarget } from '../../theme/layout';

export type OrderDragItem = {
  id: string;
  text: string;
};

type RowLayout = { y: number; height: number };

type Props = {
  items: OrderDragItem[];
  onReorder: (next: OrderDragItem[]) => void;
  renderCard: (
    item: OrderDragItem,
    index: number,
    dragHandle: ReactNode,
  ) => ReactNode;
  dragHandleA11yLabel: string;
};

function reorderItems<T>(list: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed!);
  return next;
}

function indexAtY(layouts: RowLayout[], y: number, count: number): number {
  for (let i = 0; i < count; i++) {
    const row = layouts[i];
    if (!row) continue;
    if (y < row.y + row.height / 2) return i;
  }
  return Math.max(0, count - 1);
}

type DragHandleProps = {
  active: boolean;
  a11yLabel: string;
  onGrant: () => void;
  onMove: (gesture: PanResponderGestureState) => void;
  onEnd: () => void;
};

function DragHandle({
  active,
  a11yLabel,
  onGrant,
  onMove,
  onEnd,
}: DragHandleProps) {
  const onGrantRef = useRef(onGrant);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onGrantRef.current = onGrant;
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => onGrantRef.current(),
      onPanResponderMove: (_, gesture) => onMoveRef.current(gesture),
      onPanResponderRelease: () => onEndRef.current(),
      onPanResponderTerminate: () => onEndRef.current(),
    }),
  ).current;

  return (
    <View
      style={[styles.dragHandle, active && styles.dragHandleActive]}
      accessibilityRole="adjustable"
      accessibilityLabel={a11yLabel}
      {...pan.panHandlers}
    >
      <Text style={styles.dragHandleIcon} accessible={false}>
        ⠿
      </Text>
    </View>
  );
}

export function QuizOrderDragList({
  items,
  onReorder,
  renderCard,
  dragHandleA11yLabel,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragDy, setDragDy] = useState(0);

  const layoutsRef = useRef<RowLayout[]>([]);
  const listRef = useRef<View>(null);
  const listPageYRef = useRef(0);
  const dragFromIndexRef = useRef(-1);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const resetDrag = useCallback(() => {
    setDraggingId(null);
    setDragDy(0);
    dragFromIndexRef.current = -1;
  }, []);

  const measureListY = useCallback(() => {
    listRef.current?.measureInWindow((_x, y) => {
      listPageYRef.current = y;
    });
  }, []);

  const onDragMove = useCallback(
    (gesture: PanResponderGestureState) => {
      const from = dragFromIndexRef.current;
      if (from < 0) return;

      setDragDy(gesture.dy);

      const fingerY = gesture.moveY - listPageYRef.current;
      const to = indexAtY(layoutsRef.current, fingerY, itemsRef.current.length);
      if (to === from) return;

      const next = reorderItems(itemsRef.current, from, to);
      dragFromIndexRef.current = to;
      setDragDy(0);
      onReorderRef.current(next);
    },
    [],
  );

  function onRowLayout(index: number, e: LayoutChangeEvent) {
    const { y, height } = e.nativeEvent.layout;
    layoutsRef.current[index] = { y, height };
  }

  function onListLayout(_e: LayoutChangeEvent) {
    measureListY();
  }

  return (
    <View ref={listRef} style={styles.list} onLayout={onListLayout}>
      {items.map((item, index) => {
        const dragging = draggingId === item.id;
        const dragHandle = (
          <DragHandle
            active={dragging}
            a11yLabel={dragHandleA11yLabel}
            onGrant={() => {
              measureListY();
              dragFromIndexRef.current = index;
              setDraggingId(item.id);
              setDragDy(0);
            }}
            onMove={onDragMove}
            onEnd={resetDrag}
          />
        );

        return (
          <View
            key={item.id}
            onLayout={(e) => onRowLayout(index, e)}
            style={[
              styles.row,
              dragging && styles.rowDragging,
              dragging && { transform: [{ translateY: dragDy }] },
            ]}
          >
            {renderCard(item, index, dragHandle)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    zIndex: 0,
  },
  rowDragging: {
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dragHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 0.5,
    borderColor: colors.borderSecondary,
  },
  dragHandleActive: {
    borderColor: colors.forest,
    backgroundColor: `${colors.forest}14`,
  },
  dragHandleIcon: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.forest,
    fontWeight: '700',
  },
});
