export function isDevelopmentRuntime(): boolean {
  return (
    (typeof __DEV__ !== 'undefined' && __DEV__) ||
    process.env.NODE_ENV === 'development'
  );
}
