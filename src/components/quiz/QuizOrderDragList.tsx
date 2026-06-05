import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
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

/** 손가락 Y(리스트 좌표)가 위치한 슬롯 인덱스 — 각 슬롯의 세로 중앙을 경계로 판정 */
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
  translateY: number;
  a11yLabel: string;
  onGrant: (index: number, e: GestureResponderEvent) => void;
  onMove: (gesture: PanResponderGestureState) => void;
  onEnd: () => void;
  onLayout: (index: number, e: LayoutChangeEvent) => void;
  renderCard: (item: OrderDragItem, index: number, dragging: boolean) => ReactNode;
};

function DraggableRow({
  item,
  index,
  dragging,
  translateY,
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
  const indexRef = useRef(index);
  onGrantRef.current = onGrant;
  onMoveRef.current = onMove;
  onEndRef.current = onEnd;
  indexRef.current = index;

  const pan = useRef(
    PanResponder.create({
      /** 시작 시점엔 responder를 잡지 않아 카드 안 화살표 버튼 등 자식 탭이 동작하게 한다. 의도적 이동(>4px)이 있을 때만 드래그로 전환. */
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => onGrantRef.current(indexRef.current, e),
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
        dragging && { transform: [{ translateY }] },
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
  const [translateY, setTranslateY] = useState(0);

  const layoutsRef = useRef<RowLayout[]>([]);
  const listRef = useRef<View>(null);
  const listPageYRef = useRef(0);
  const dragFromIndexRef = useRef(-1);
  /** 드래그 시작 시 손가락이 카드 상단에서 떨어진 거리 — 카드를 손가락에 정확히 붙여 둔다. */
  const grabOffsetRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const resetDrag = useCallback(() => {
    setDraggingId(null);
    setTranslateY(0);
    dragFromIndexRef.current = -1;
  }, []);

  const measureListY = useCallback(() => {
    listRef.current?.measureInWindow((_x, y) => {
      listPageYRef.current = y;
    });
  }, []);

  /** 현재 드래그 슬롯 기준으로 카드의 translateY를 절대 위치로 계산(누적 오차 없음). */
  const computeTranslateY = useCallback((fingerY: number, slotIndex: number) => {
    const slot = layoutsRef.current[slotIndex];
    if (!slot) return 0;
    return fingerY - grabOffsetRef.current - slot.y;
  }, []);

  const onGrant = useCallback(
    (index: number, e: GestureResponderEvent) => {
      measureListY();
      const fingerY = e.nativeEvent.pageY - listPageYRef.current;
      const slot = layoutsRef.current[index];
      grabOffsetRef.current = slot ? fingerY - slot.y : 0;
      dragFromIndexRef.current = index;
      setDraggingId(itemsRef.current[index]?.id ?? null);
      setTranslateY(0);
    },
    [measureListY],
  );

  const onDragMove = useCallback(
    (gesture: PanResponderGestureState) => {
      const from = dragFromIndexRef.current;
      if (from < 0) return;

      const fingerY = gesture.moveY - listPageYRef.current;
      const count = itemsRef.current.length;
      const to = indexAtY(layoutsRef.current, fingerY, count);

      if (to !== from && to >= 0 && to < count) {
        const next = reorderItems(itemsRef.current, from, to);
        dragFromIndexRef.current = to;
        onReorderRef.current(next);
        // 새 슬롯 기준으로 즉시 보정 — 카드가 손가락에 그대로 붙어 있게 한다.
        setTranslateY(computeTranslateY(fingerY, to));
      } else {
        setTranslateY(computeTranslateY(fingerY, from));
      }
    },
    [computeTranslateY],
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
      {items.map((item, index) => (
        <DraggableRow
          key={item.id}
          item={item}
          index={index}
          dragging={draggingId === item.id}
          translateY={draggingId === item.id ? translateY : 0}
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
