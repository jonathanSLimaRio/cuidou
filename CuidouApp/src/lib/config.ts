import Constants from "expo-constants";
import { Platform } from "react-native";

type ExtraConfig = {
  apiBaseUrl?: string;
  googleExpoClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  googleWebClientId?: string;
};

function getExtraConfig(): ExtraConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
  return extra;
}

function defaultApiBaseUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

const extra = getExtraConfig();

export const appConfig = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? defaultApiBaseUrl(),
  authScheme: "cuidouapp",
  google: {
    expoClientId:
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? extra.googleExpoClientId ?? "",
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId ?? "",
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
      extra.googleAndroidClientId ??
      "",
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.googleWebClientId ?? "",
  },
};
