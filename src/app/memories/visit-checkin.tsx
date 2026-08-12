import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';
import { restaurantService, mapRowToRestaurant } from '@/services/restaurantService';
import { visitService } from '@/services/visitService';

const moodTags = ['Loved it', 'Good', 'Okay', 'Not for me'];

export default function VisitCheckinScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [selectedTag, setSelectedTag] = useState('Loved it');
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);
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
          const mapped = mapRowToRestaurant(row);
          setRestaurant(mapped);
          if (mapped.image) setPhotoUrl(mapped.image);
        }
      } catch (err) {
        console.error('[VisitCheckinScreen] Error loading restaurant:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRest();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const handleSubmit = async () => {
    if (!user || !restaurant || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    const formattedNote = note.trim() ? `[${selectedTag}] ${note.trim()}` : `[${selectedTag}] Checked in at ${restaurant.name}`;

    const { error } = await visitService.createVisit(user.id, restaurant.id, {
      note: formattedNote,
      photoUrl,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        RootNavigation.toTrail();
      }, 1200);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Check In & Log Memory" onBackPress={() => RootNavigation.back()} />
        <View style={styles.centerWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Check In & Log Memory" onBackPress={() => RootNavigation.back()} />
        <View style={styles.centerWrapper}>
          <CraveText variant="h3">Restaurant Not Found</CraveText>
          <AppButton title="Go Back" onPress={() => RootNavigation.back()} variant="ghost" style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Check In & Log Memory" onBackPress={() => RootNavigation.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!submitted ? (
          <>
            {/* Restaurant Summary */}
            <View style={[styles.restCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <CraveText variant="h3">{restaurant.name}</CraveText>
              <CraveText variant="caption" color={colors.secondaryText}>
                {restaurant.category} • {restaurant.address}
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

            {/* Satisfaction Tag Selector */}
            <View style={styles.section}>
              <CraveText variant="subtitle">How was your visit?</CraveText>
              <View style={styles.tagsContainer}>
                {moodTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => setSelectedTag(tag)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isSelected ? colors.visited : colors.surface,
                          borderColor: isSelected ? colors.visited : colors.border,
                        },
                      ]}
                    >
                      <CraveText
                        variant="caption"
                        color={isSelected ? '#FFFFFF' : colors.primaryText}
                        style={styles.pillText}
                      >
                        {tag}
                      </CraveText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Photo Attachment Preview */}
            {photoUrl && (
              <View style={styles.section}>
                <CraveText variant="subtitle">Memory Photo</CraveText>
                <View style={[styles.photoPreviewWrapper, { borderColor: colors.border }]}>
                  <Image source={{ uri: photoUrl }} style={styles.attachedImage} />
                </View>
              </View>
            )}

            {/* Personal Memory Note */}
            <View style={styles.section}>
              <CraveText variant="subtitle">Personal Memory Note</CraveText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What made this visit memorable (favorite dish, pairing, who you were with)..."
                  placeholderTextColor={colors.mutedText}
                  multiline
                  numberOfLines={4}
                  editable={!submitting}
                  style={[styles.input, { color: colors.primaryText, fontFamily: 'SpaceGrotesk_400Regular' }]}
                />
              </View>
            </View>

            <AppButton
              title={submitting ? 'Saving Visit...' : 'Log Visit to Trail'}
              onPress={handleSubmit}
              variant="visited"
              size="large"
              disabled={submitting}
              fullWidth
              icon="checkmark-circle"
              style={styles.submitBtn}
            />
          </>
        ) : (
          <View style={styles.successState}>
            <Ionicons name="checkmark-circle" size={64} color={colors.visited} />
            <CraveText variant="h2" align="center">
              Visit saved to your Trail!
            </CraveText>
            <CraveText variant="body" align="center" color={colors.secondaryText}>
              Your check-in for {restaurant.name} has been recorded in your private memory log.
            </CraveText>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 20,
  },
  restCard: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
  },
  photoPreviewWrapper: {
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  attachedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
  },
  input: {
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 12,
  },
  successState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
});
