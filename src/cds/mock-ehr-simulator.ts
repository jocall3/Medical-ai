export const simulateRequest = (hook: string, context: any) => {
  console.log(`Simulating ${hook} request with context:`, context);
  return { hook, context };
};