import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HistoryEntry } from '../services/HistoryService';

interface Props {
  entries: HistoryEntry[];
  onClearAll: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

const Colors = {
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  surface: '#FFFFFF',
  cardBackground: '#F1F5F9',
  border: '#E2E8F0',
  primary: '#6366F1',
  danger: '#EF4444',
  amber: '#F59E0B',
};

const HistoryScreen: React.FC<Props> = ({ entries, onClearAll, onToggleFavorite, onDelete }) => {
  const [helpVisible, setHelpVisible] = React.useState(false);
  const total = entries.length;
  const favorites = entries.filter(e => e.favorite).length;
  const renderItem = ({ item }: { item: HistoryEntry }) => {
    const title = item.output.type === 'text' ? item.output.value : item.input.value;
    const subtitle = `${item.mode.replaceAll('_',' → ')} • ${item.language} • ${new Date(item.timestamp).toLocaleString()}`;
    const conf = typeof item.confidence === 'number' ? Math.round(item.confidence * 100) : undefined;

    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.iconCircle}>
            <Icon name={item.mode === 'text_to_sign' ? 'translate' : item.mode === 'voice_to_sign' ? 'mic' : item.mode === 'sign_to_voice' ? 'record-voice-over' : 'text-fields'} size={18} color={Colors.surface} />
          </View>
        </View>
        <View style={styles.rowCenter}>
          <Text style={styles.title} numberOfLines={1}>{title || '—'}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
        </View>
        <View style={styles.rowRight}>
          {conf !== undefined && (
            <View style={styles.confChip}><Text style={styles.confText}>{conf}%</Text></View>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => onToggleFavorite(item.id)}>
            <Icon name={item.favorite ? 'star' : 'star-border'} size={20} color={item.favorite ? Colors.amber : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(item.id)}>
            <Icon name="delete-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top bar with filters (future) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={onClearAll}>
            <Icon name="delete-sweep" size={18} color={Colors.surface} />
            <Text style={styles.toolbarText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}><Text style={styles.statPillNum}>{total}</Text><Text style={styles.statPillLabel}>Total</Text></View>
        <View style={styles.statPill}><Text style={styles.statPillNum}>{favorites}</Text><Text style={styles.statPillLabel}>Favorites</Text></View>
      </View>

      {/* Big red help banner like feature card */}
      <TouchableOpacity style={styles.helpBanner} onPress={() => setHelpVisible(true)}>
        <View style={styles.helpBannerLeft}>
          <View style={styles.helpBannerIcon}><Icon name="image" size={22} color="#fff" /></View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.helpBannerTitle}>ASL Alphabet Help</Text>
            <Text style={styles.helpBannerDesc}>Tap to view the ASL A–Z chart</Text>
          </View>
        </View>
        <View style={styles.helpBannerRight}>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
      <FlatList
        data={entries}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyDesc}>Your recent translations will appear here.</Text>
          </View>
        }
      />
      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="fade" transparent onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <View style={styles.helpTitleRow}>
                <Icon name="image" size={18} color={Colors.primary} />
                <Text style={styles.helpTitleText}>ASL Alphabet</Text>
              </View>
              <TouchableOpacity onPress={() => setHelpVisible(false)}>
                <Icon name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.helpBody}>
              <Image
                source={require('../HelpASLAlphabat/Asl.png')}
                style={styles.helpImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  toolbarText: { color: Colors.surface, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  statPillNum: { color: Colors.primary, fontWeight: '800' },
  statPillLabel: { color: Colors.textSecondary, fontWeight: '700' },
  helpBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#EF4444', padding: 14, borderRadius: 14, elevation: 3 },
  helpBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  helpBannerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  helpBannerTitle: { color: '#fff', fontWeight: '800' },
  helpBannerDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  helpBannerRight: { paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 12, marginVertical: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  rowLeft: { width: 34, alignItems: 'center' },
  iconCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  rowCenter: { flex: 1, paddingHorizontal: 8 },
  title: { color: Colors.textPrimary, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, marginTop: 2, fontSize: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#ECFDF5' },
  confText: { color: '#065F46', fontSize: 11, fontWeight: '700' },
  iconBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { marginTop: 8, fontWeight: '800', color: Colors.textPrimary },
  emptyDesc: { color: Colors.textSecondary, fontSize: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  helpOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  helpCard: { width: '100%', maxWidth: 520, backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden' },
  helpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  helpTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpTitleText: { color: Colors.textPrimary, fontWeight: '800' },
  helpBody: { padding: 10 },
  helpImage: { width: '100%', height: 420, backgroundColor: '#000' },
});

export default HistoryScreen;


