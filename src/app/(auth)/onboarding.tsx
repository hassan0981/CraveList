import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/AppButton';
import { CraveText } from '@/components/CraveText';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { RootNavigation } from '@/navigation';

const onboardingSlides = [
  {
    title: 'Discover Culinary Gems',
    subtitle: 'Explore curated neighborhood bistros, hidden cocktail bars, and artisanal bakeries around you.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Never Forget a Craving',
    subtitle: 'Save places you want to try, add private notes, and organize your personal food wishlist.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Proximity Craving Alerts',
    subtitle: 'Get notified automatically whenever you wander near a spot saved on your trail.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Create & Share Memories',
    subtitle: 'Check in when you visit, log your rating & photo, and curate dining plans with friends.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const slide = onboardingSlides[currentIndex];

  const finishOnboarding = async () => {
    await completeOnboarding();
    RootNavigation.toLogin();
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topHeader}>
        <CraveText variant="h3" color={colors.primary}>
          CraveList
        </CraveText>
        <AppButton
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="small"
        />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: slide.image }}
          style={[styles.heroImage, { borderColor: colors.border }]}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.paginationRow}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <CraveText variant="h1" align="center" style={styles.title}>
          {slide.title}
        </CraveText>

        <CraveText
          variant="body"
          align="center"
          color={colors.secondaryText}
          style={styles.subtitle}
        >
          {slide.subtitle}
        </CraveText>

        <View style={styles.actionContainer}>
          <AppButton
            title={currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
            variant="primary"
            size="large"
            fullWidth
            icon="arrow-forward"
            iconPosition="right"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    maxHeight: 300,
    borderRadius: 24,
    borderWidth: 1,
    resizeMode: 'cover',
  },
  contentContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  title: {
    lineHeight: 34,
  },
  subtitle: {
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 8,
  },
});
