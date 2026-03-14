import axios from 'axios';
import { Platform } from 'react-native';

function resolveDefaultBaseUrl(): string {
  if (Platform.OS === 'android') {
    // Android emulator cannot reach host via localhost.
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
}

function normalizeAndroidBaseUrl(url: string): string {
  if (Platform.OS !== 'android') {
    return url;
  }

  // If env var points to localhost on Android, route through emulator-host bridge.
  return url
    .replace('http://localhost:', 'http://10.0.2.2:')
    .replace('https://localhost:', 'https://10.0.2.2:')
    .replace('http://127.0.0.1:', 'http://10.0.2.2:')
    .replace('https://127.0.0.1:', 'https://10.0.2.2:');
}

const rawBaseURL = process.env.EXPO_PUBLIC_API_BASE_URL ?? resolveDefaultBaseUrl();
const baseURL = normalizeAndroidBaseUrl(rawBaseURL);

if (__DEV__) {
  console.log('[api] baseURL =', baseURL);
}

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
