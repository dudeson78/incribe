import Svg, { Circle, Line, Path } from 'react-native-svg';

import { tokens } from '../../theme/tokens';

export type TabIconName = 'training' | 'quiz' | 'manage' | 'my';

const STROKE = 1.75;

type Props = {
  name: TabIconName;
  color: string;
  size?: number;
};

const strokeProps = (color: string) => ({
  stroke: color,
  strokeWidth: STROKE,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** 하단 탭 — stroke 기반 SVG 아이콘 (22px) */
export function TabBarStrokeIcon({
  name,
  color,
  size = tokens.tabBar.iconSize,
}: Props) {
  const s = strokeProps(color);

  if (name === 'training') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          {...s}
          d="M9 18h6M10 21h4M12 3a5 5 0 0 0-3.2 8.5V16h6.4v-4.5A5 5 0 0 0 12 3z"
        />
      </Svg>
    );
  }

  if (name === 'quiz') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle {...s} cx="12" cy="12" r="9" />
        <Path
          {...s}
          d="M9.5 9.25a2.75 2.75 0 0 1 4.72 1.9c0 1.65-2.22 2.1-2.22 3.6"
        />
        <Circle fill={color} cx="12" cy="17.25" r="0.9" stroke="none" />
      </Svg>
    );
  }

  if (name === 'manage') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Line {...s} x1="5" y1="7" x2="19" y2="7" />
        <Line {...s} x1="5" y1="12" x2="19" y2="12" />
        <Line {...s} x1="5" y1="17" x2="19" y2="17" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...s} cx="12" cy="12" r="8.25" />
      <Circle {...s} cx="12" cy="12" r="3.25" />
      <Line {...s} x1="12" y1="2.5" x2="12" y2="5.5" />
      <Line {...s} x1="12" y1="18.5" x2="12" y2="21.5" />
      <Line {...s} x1="2.5" y1="12" x2="5.5" y2="12" />
      <Line {...s} x1="18.5" y1="12" x2="21.5" y2="12" />
    </Svg>
  );
}
