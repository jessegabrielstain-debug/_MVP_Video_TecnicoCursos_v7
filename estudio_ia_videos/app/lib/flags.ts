export type FeatureFlagName = 'enableAdvancedAnalytics' | 'enableVideoPreview' | 'enableBetaEditor';

type FlagsState = Record<FeatureFlagName, boolean>;

const defaults: FlagsState = {
  enableAdvancedAnalytics: false,
  enableVideoPreview: false,
  enableBetaEditor: false,
};

function readEnvBoolean(name: string, env: NodeJS.ProcessEnv = process.env): boolean | undefined {
  const v = env[name];
  if (!v) return undefined;
  if (['1', 'true', 'on', 'yes'].includes(v.toLowerCase())) return true;
  if (['0', 'false', 'off', 'no'].includes(v.toLowerCase())) return false;
  return undefined;
}

export function loadFlags(env: NodeJS.ProcessEnv = process.env): FlagsState {
  return {
    enableAdvancedAnalytics: readEnvBoolean('FLAG_ENABLE_ADVANCED_ANALYTICS', env) ?? defaults.enableAdvancedAnalytics,
    enableVideoPreview: readEnvBoolean('FLAG_ENABLE_VIDEO_PREVIEW', env) ?? defaults.enableVideoPreview,
    enableBetaEditor: readEnvBoolean('FLAG_ENABLE_BETA_EDITOR', env) ?? defaults.enableBetaEditor,
  };
}

export const flags = loadFlags();