import { RestaurantRow } from '@/types/database';

export interface BrandGroup {
  brandId: string;
  brandName: string;
  category: string;
  image: string;
  branchCount: number;
  branches: RestaurantRow[];
  representativeRestaurantId: string;
  isSaved?: boolean;
}

/**
 * Standardize brand names and generate clean brand identifiers.
 * E.g., "KFC DHA Phase 5", "KFC - Johar Town", "Kentucky Fried Chicken" -> Brand Name: "KFC", Brand ID: "kfc".
 * "Butt Karahi - Johar Town", "Butt Karahi DHA" -> Brand Name: "Butt Karahi", Brand ID: "butt_karahi".
 */
export function normalizeBrand(name: string): { brandName: string; brandId: string } {
  if (!name) return { brandName: 'Spot', brandId: 'spot' };

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // Known Major Brand Matchers
  if (lower.includes('kfc') || lower.includes('kentucky fried chicken')) {
    return { brandName: 'KFC', brandId: 'kfc' };
  }
  if (lower.includes('butt karahi')) {
    return { brandName: 'Butt Karahi', brandId: 'butt_karahi' };
  }
  if (lower.includes('mcdonald') || lower.includes("mcdonald's")) {
    return { brandName: "McDonald's", brandId: 'mcdonalds' };
  }
  if (lower.includes('subway')) {
    return { brandName: 'Subway', brandId: 'subway' };
  }
  if (lower.includes('domino')) {
    return { brandName: "Domino's Pizza", brandId: 'dominos' };
  }
  if (lower.includes('pizza hut')) {
    return { brandName: 'Pizza Hut', brandId: 'pizzahut' };
  }
  if (lower.includes('hardee')) {
    return { brandName: "Hardee's", brandId: 'hardees' };
  }
  if (lower.includes('starbucks')) {
    return { brandName: 'Starbucks', brandId: 'starbucks' };
  }
  if (lower.includes('second cup')) {
    return { brandName: 'Second Cup Coffee', brandId: 'second_cup' };
  }
  if (lower.includes('gloria jean')) {
    return { brandName: "Gloria Jean's", brandId: 'gloria_jeans' };
  }
  if (lower.includes('cafe aylanto') || lower.includes('café aylanto')) {
    return { brandName: 'Café Aylanto', brandId: 'cafe_aylanto' };
  }
  if (lower.includes('saltn pepper') || lower.includes('salt n pepper')) {
    return { brandName: 'Salt n Pepper', brandId: 'salt_n_pepper' };
  }
  if (lower.includes('howdy')) {
    return { brandName: 'Howdy', brandId: 'howdy' };
  }
  if (lower.includes('johnny & jugnu') || lower.includes('johnny and jugnu')) {
    return { brandName: 'Johnny & Jugnu', brandId: 'johnny_and_jugnu' };
  }

  // Fallback stripping common branch suffixes: "DHA", "Gulberg", "Johar Town", "Model Town", "Phase 5", "Lahore", "Branch", "-"
  const cleaned = trimmed
    .replace(/[\s,-]+(dha|gulberg|johar town|model town|phase \d+|lahore|branch|mall|road|street|ct).*/i, '')
    .trim();

  const brandName = cleaned || trimmed;
  const brandId = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  return { brandName, brandId };
}

export const brandService = {
  /**
   * Group list of physical branch records into brand-level structures.
   */
  groupRestaurantsByBrand(
    restaurants: RestaurantRow[],
    savedRestaurantIds: Set<string> = new Set()
  ): BrandGroup[] {
    const brandMap = new Map<string, BrandGroup>();

    for (const rest of restaurants) {
      const { brandName, brandId } = normalizeBrand(rest.name);

      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, {
          brandId,
          brandName,
          category: rest.category || 'Dining',
          image: rest.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
          branchCount: 0,
          branches: [],
          representativeRestaurantId: rest.id,
          isSaved: false,
        });
      }

      const group = brandMap.get(brandId)!;
      group.branchCount += 1;
      group.branches.push(rest);

      if (savedRestaurantIds.has(rest.id)) {
        group.isSaved = true;
      }
    }

    return Array.from(brandMap.values());
  },

  /**
   * Get all physical branch records matching a brand ID or brand name.
   */
  getBranchesForBrand(brandIdentifier: string, allRestaurants: RestaurantRow[]): RestaurantRow[] {
    const { brandId: targetId, brandName: targetName } = normalizeBrand(brandIdentifier);

    return allRestaurants.filter((rest) => {
      const { brandId, brandName } = normalizeBrand(rest.name);
      return brandId === targetId || brandName.toLowerCase() === targetName.toLowerCase();
    });
  },
};
