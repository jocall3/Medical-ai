export const resolvePrefetch = (template: Record<string, string>, context: any) => {
  const resolved: Record<string, any> = {};
  for (const [key, path] of Object.entries(template)) {
    resolved[key] = path.replace('{{context.patientId}}', context.patientId);
  }
  return resolved;
};