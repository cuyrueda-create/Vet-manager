import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HeaderBar({ title, subtitle, onBack, rightIcon, rightOnPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}

        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>

        {rightIcon ? (
          <TouchableOpacity style={styles.backBtn} onPress={rightOnPress}>
            <Text style={styles.backIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0066b3', paddingBottom: 12, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: 'white', fontSize: 20, fontWeight: '700' },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
