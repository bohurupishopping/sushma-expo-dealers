import { Redirect } from 'expo-router';

export default function AuthIndex() {
  // Redirect to login by default
  return <Redirect href="/(auth)/login" />;
}
