import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { savedPlaceService } from '@/services/savedPlaceService';
import { Restaurant } from '@/constants/mockData';

const categories = ['Ramen', 'Japanese', 'Date Night', 'Cozy Spot', 'Casual Lunch'];

export default function SavePlaceScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [priority, setPriority] = useState<'normal' | 'high'>('high');
  const [selectedTag, setSelectedTag] = useState('Ramen');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRest() {
      if (!params.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const row = await restaurantService.getRestaurantById(params.id);
        if (isMounted && row) {
          setRestaurant(mapRowToRestaurant(row, false));
        }
      } catch (err) {
        console.error('[SavePlaceScreen] Error loading restaurant:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRest();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleSave = async () => {
    if (!user || !restaurant || saving) return;

    setSaving(true);
    setErrorMessage(null);

    const { error, alreadySaved } = await savedPlaceService.savePlace(user.id, restaurant.id, {
      category: selectedTag,
      note: note.trim() || undefined,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSaved(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerWrapper}>
          <CraveText variant="h3">Restaurant Not Found</CraveText>
          <AppButton title="Close" onPress={() => RootNavigation.back()} variant="ghost" style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <CraveText variant="h2">Save Place</CraveText>
        <TouchableOpacity onPress={() => RootNavigation.back()}>
          <Ionicons name="close" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={[styles.restSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CraveText variant="h3">{restaurant.name}</CraveText>
          <CraveText variant="caption" color={colors.secondaryText}>
            {restaurant.category} • 📍 {restaurant.address}
          </CraveText>
        </View>

        {errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <CraveText variant="caption" color="#991B1B">
              {errorMessage}
            </CraveText>
          </View>
        )}

        {!saved ? (
          <>
            {/* Why do you want to try it? */}
            <View style={styles.section}>
              <CraveText variant="subtitle">Why do you want to try it?</CraveText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Found on Instagram reel. Need to try the sourdough..."
                  placeholderTextColor={colors.mutedText}
                  multiline
                  numberOfLines={3}
                  editable={!saving}
                  style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
                />
              </View>
            </View>

            {/* Priority Selector */}
            <View style={styles.section}>
              <CraveText variant="subtitle">Priority Level</CraveText>
              <View style={styles.priorityRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPriority('normal')}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: priority === 'normal' ? colors.surface : 'transparent',
                      borderColor: priority === 'normal' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons name="bookmark-outline" size={16} color={colors.primaryText} />
                  <CraveText variant="bodyBold" color={colors.primaryText}>
                    Normal Craving
                  </CraveText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setPriority('high')}
                  style={[
                    styles.priorityOption,
                    {
                      backgroundColor: priority === 'high' ? colors.badgeBg : 'transparent',
                      borderColor: priority === 'high' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons name="flame" size={16} color={colors.primary} />
                  <CraveText variant="bodyBold" color={colors.primary}>
                    🔥 High Priority
                  </CraveText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Tag */}
            <View style={styles.section}>
              <CraveText variant="subtitle">Category Tag</CraveText>
              <View style={styles.tagsContainer}>
                {categories.map((cat) => {
                  const isSelected = selectedTag === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedTag(cat)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <CraveText
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : colors.primaryText}
                        style={styles.pillText}
                      >
                        {cat}
                      </CraveText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <AppButton
              title={saving ? 'Saving...' : 'Save to My Cravings'}
              onPress={handleSave}
              variant="primary"
              size="large"
              disabled={saving}
              fullWidth
              icon="bookmark"
              style={styles.saveBtn}
            />
          </>
        ) : (
          <View style={styles.successState}>
            <View style={[styles.successCircle, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
            </View>
            <CraveText variant="h2" align="center">
              ✓ Added to My Cravings
            </CraveText>
            <CraveText variant="body" align="center" color={colors.secondaryText}>
              We'll remind you whenever you wander near {restaurant.name}.
            </CraveText>

            <View style={styles.successActions}>
              <AppButton
                title="View My Cravings"
                onPress={() => {
                  RootNavigation.back();
                  RootNavigation.toCravings();
                }}
                variant="primary"
                size="large"
                fullWidth
              />
              <AppButton
                title="Back to Spot"
                onPress={() => RootNavigation.back()}
                variant="ghost"
                size="medium"
                fullWidth
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20,
  },
  restSummaryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  section: {
    gap: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 90,
  },
  input: {
    fontSize: 14,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 8,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successActions: {
    width: '100%',
    gap: 8,
    marginTop: 12,
  },
});
