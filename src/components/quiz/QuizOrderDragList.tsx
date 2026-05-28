import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';

export type OrderDragItem = {
  id: string;
  text: string;
};

type RowLayout = { y: number; height: number };

type Props = {
  items: OrderDragItem[];
  onReorder: (next: OrderDragItem[]) => void;
  renderCard: (item: OrderDragItem, index: number, dragging: boolean) => ReactNode;
  dragA11yLabel: string;
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

type DraggableRowProps = {
  item: OrderDragItem;
  index: number;
  dragging: boolean;
  dragDy: number;
  a11yLabel: string;
  onGrant: (index: number) => void;
  onMove: (gesture: PanResponderGestureState) => void;
  onEnd: () => void;
  onLayout: (index: number, e: LayoutChangeEvent) => void;
  renderCard: (item: OrderDragItem, index: number, dragging: boolean) => ReactNode;
};

function DraggableRow({
  item,
  index,
  dragging,
  dragDy,
  a11yLabel,
  onGrant,
  onMove,
  onEnd,
  onLayout,
  renderCard,
}: DraggableRowProps) {
  const onGrantRef = useRef(onGrant);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);
  onGrantRef.current = onGrant;
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 2 || Math.abs(gesture.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => onGrantRef.current(index),
      onPanResponderMove: (_, gesture) => onMoveRef.current(gesture),
      onPanResponderRelease: () => onEndRef.current(),
      onPanResponderTerminate: () => onEndRef.current(),
    }),
  ).current;

  return (
    <View
      onLayout={(e) => onLayout(index, e)}
      style={[
        styles.row,
        dragging && styles.rowDragging,
        dragging && { transform: [{ translateY: dragDy }] },
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel={a11yLabel}
      {...pan.panHandlers}
    >
      {renderCard(item, index, dragging)}
    </View>
  );
}

export function QuizOrderDragList({
  items,
  onReorder,
  renderCard,
  dragA11yLabel,
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

  const onDragMove = useCallback((gesture: PanResponderGestureState) => {
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
  }, []);

  function onRowLayout(index: number, e: LayoutChangeEvent) {
    const { y, height } = e.nativeEvent.layout;
    layoutsRef.current[index] = { y, height };
  }

  function onListLayout(_e: LayoutChangeEvent) {
    measureListY();
  }

  function onGrant(index: number) {
    measureListY();
    dragFromIndexRef.current = index;
    setDraggingId(itemsRef.current[index]?.id ?? null);
    setDragDy(0);
  }

  return (
    <View ref={listRef} style={styles.list} onLayout={onListLayout}>
      {items.map((item, index) => (
        <DraggableRow
          key={item.id}
          item={item}
          index={index}
          dragging={draggingId === item.id}
          dragDy={dragDy}
          a11yLabel={dragA11yLabel}
          onGrant={onGrant}
          onMove={onDragMove}
          onEnd={resetDrag}
          onLayout={onRowLayout}
          renderCard={renderCard}
        />
      ))}
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
});
