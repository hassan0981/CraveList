import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CraveText } from '@/components/CraveText';
import { Restaurant } from '@/constants/mockData';
import { useTheme } from '@/context/ThemeContext';

interface InteractiveMapProps {
  restaurants?: Restaurant[];
  onSelectRestaurant?: (restaurant: Restaurant) => void;
  height?: number;
  showControls?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  restaurants = [],
  onSelectRestaurant,
  height = 320,
  showControls = true,
}) => {
  const { colors } = useTheme();
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(restaurants[0] || null);

  useEffect(() => {
    if (restaurants.length > 0) {
      setSelectedRest(restaurants[0]);
    }
  }, [restaurants]);

  // Pin coordinate mappings to canvas percentage layout
  const pinPositions = [
    { top: '32%', left: '42%' },
    { top: '24%', left: '68%' },
    { top: '65%', left: '28%' },
    { top: '55%', left: '72%' },
    { top: '75%', left: '58%' },
  ];

  const handlePinPress = (rest: Restaurant) => {
    setSelectedRest(rest);
    if (onSelectRestaurant) {
      onSelectRestaurant(rest);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor: colors.mapBackground, borderColor: colors.border },
      ]}
    >
      {/* Map Background Grid Canvas */}
      <View style={[StyleSheet.absoluteFill, styles.gridCanvas]}>
        {/* Simulated Water Body */}
        <View style={[styles.waterBody, { backgroundColor: colors.mapWater }]} />

        {/* Simulated Park Region */}
        <View style={[styles.parkArea, { backgroundColor: colors.mapPark }]} />

        {/* Primary Simulated Roads */}
        <View style={[styles.roadHorizontal1, { backgroundColor: colors.mapRoad }]} />
        <View style={[styles.roadHorizontal2, { backgroundColor: colors.mapRoad }]} />
        <View style={[styles.roadVertical1, { backgroundColor: colors.mapRoad }]} />
        <View style={[styles.roadVertical2, { backgroundColor: colors.mapRoad }]} />
      </View>

      {/* User Current Location Indicator */}
      <View style={[styles.userLocationPin, { top: '48%', left: '46%' }]}>
        <View style={[styles.userPulseRing, { borderColor: colors.primary }]} />
        <View style={[styles.userDot, { backgroundColor: colors.primary }]} />
      </View>

      {/* Restaurant Map Pins */}
      {restaurants.slice(0, 5).map((rest, index) => {
        const isSelected = selectedRest?.id === rest.id;
        const pos = pinPositions[index % pinPositions.length];
        const isVisited = rest.visited;

        return (
          <TouchableOpacity
            key={rest.id}
            activeOpacity={0.8}
            onPress={() => handlePinPress(rest)}
            style={[
              styles.pinContainer,
              { top: pos.top as any, left: pos.left as any },
            ]}
          >
            <View
              style={[
                styles.pinMarker,
                {
                  backgroundColor: isVisited ? colors.visited : colors.primary,
                  borderColor: '#FFFFFF',
                  transform: [{ scale: isSelected ? 1.25 : 1 }],
                },
              ]}
            >
              <Ionicons
                name={isVisited ? 'checkmark' : 'bookmark'}
                size={12}
                color="#FFFFFF"
              />
            </View>
            <View
              style={[
                styles.pinTip,
                { borderTopColor: isVisited ? colors.visited : colors.primary },
              ]}
            />
          </TouchableOpacity>
        );
      })}

      {/* Selected Restaurant Callout Overlay Card */}
      {selectedRest && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onSelectRestaurant && onSelectRestaurant(selectedRest)}
          style={[
            styles.calloutCard,
            { backgroundColor: colors.elevatedSurface, borderColor: colors.border },
          ]}
        >
          <View style={styles.calloutHeader}>
            <View style={styles.calloutTextGroup}>
              <CraveText variant="bodyBold" numberOfLines={1}>
                {selectedRest.name}
              </CraveText>
              <CraveText variant="caption" color={colors.secondaryText} numberOfLines={1}>
                Branch: {selectedRest.address || 'Lahore Spot'} • 📍 {selectedRest.distance}
              </CraveText>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onSelectRestaurant && onSelectRestaurant(selectedRest)}
              style={styles.calloutAction}
            >
              <CraveText variant="caption" color={colors.primary}>
                View Spot Details →
              </CraveText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Map Controls */}
      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.elevatedSurface, borderColor: colors.border }]}
          >
            <Ionicons name="layers-outline" size={16} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridCanvas: {
    overflow: 'hidden',
  },
  waterBody: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.6,
  },
  parkArea: {
    position: 'absolute',
    bottom: -30,
    left: -35,
    width: 200,
    height: 160,
    borderRadius: 80,
    opacity: 0.7,
  },
  roadHorizontal1: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    height: 12,
    opacity: 0.8,
  },
  roadHorizontal2: {
    position: 'absolute',
    top: '68%',
    left: 0,
    right: 0,
    height: 8,
    opacity: 0.7,
  },
  roadVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 12,
    opacity: 0.8,
  },
  roadVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '70%',
    width: 8,
    opacity: 0.7,
  },

  // User location pin
  userLocationPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    opacity: 0.4,
    position: 'absolute',
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Restaurant Map Pins
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 2,
  },
  pinMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Callout Card Overlay
  calloutCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 60,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calloutTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  calloutAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Map Controls
  controlsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});
