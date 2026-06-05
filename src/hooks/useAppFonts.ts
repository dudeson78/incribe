import {
  NotoSerifKR_400Regular,
  NotoSerifKR_500Medium,
  useFonts,
} from '@expo-google-fonts/noto-serif-kr';

/** 앱 구동 시 구절용 serif 로드. false면 스플래시 대기. */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    NotoSerifKR_400Regular,
    NotoSerifKR_500Medium,
  });
  return loaded;
}
