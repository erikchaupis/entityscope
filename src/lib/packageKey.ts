/** Last segment of a Java/Hibernate package, used for grouping in the UI. */
export function getTopLevelPackage(packageName: string): string {
  const trimmed = packageName.trim();
  if (!trimmed) {
    return '(default)';
  }
  const parts = trimmed.split('.');
  return parts[parts.length - 1] || trimmed;
}
