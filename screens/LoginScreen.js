import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { C } from '../constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  async function handleSubmit() {
    setErrorMsg('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nyla</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={C.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={C.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{mode === 'login' ? 'Log in' : 'Sign up'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        <Text style={styles.switchText}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'DancingScript_600SemiBold',
    fontSize: 40,
    color: C.rose,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: C.espresso,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.linen,
  },
  error: {
    color: C.burg,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: C.rose,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
});