import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Auto-load local .env file variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

console.log('Using Key:', SUPABASE_KEY ? (SUPABASE_KEY.substring(0, 15) + '...') : 'NONE');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface GeoJSONFeature {
  type: string;
  id?: string;
  properties?: Record<string, any>;
  geometry?: {
    type: string;
    coordinates: any;
  };
}

interface RestaurantRecord {
  id: string;
  name: string;
  category: string;
  address: string;
  image_url: string;
  latitude: number;
  longitude: number;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Bakery & Pastry': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  'Cafe & Coffee': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
  'Fast Food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80',
  'Pakistani Cuisine': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  'Italian Cuisine': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'Chinese Cuisine': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  'Dining & Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
};

/**
 * Generate a deterministic UUID v4 string from any text seed.
 */
export function stringToUUID(str: string): string {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return (
    hash.substring(0, 8) +
    '-' +
    hash.substring(8, 12) +
    '-4' +
    hash.substring(13, 16) +
    '-a' +
    hash.substring(17, 20) +
    '-' +
    hash.substring(20, 32)
  );
}

function getCoordinates(geometry: any): { lat: number; lng: number } | null {
  if (!geometry || !geometry.coordinates) return null;
  if (geometry.type === 'Point') {
    return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
  }
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0];
    let sumLat = 0, sumLng = 0;
    ring.forEach((pt: number[]) => { sumLng += pt[0]; sumLat += pt[1]; });
    return { lng: sumLng / ring.length, lat: sumLat / ring.length };
  }
  if (geometry.type === 'MultiPolygon') {
    const ring = geometry.coordinates[0][0];
    let sumLat = 0, sumLng = 0;
    ring.forEach((pt: number[]) => { sumLng += pt[0]; sumLat += pt[1]; });
    return { lng: sumLng / ring.length, lat: sumLat / ring.length };
  }
  return null;
}

export async function runImport() {
  console.log('🚀 Starting CraveList Restaurant Data Import from export (1).geojson...');

  const filePath = path.resolve(process.cwd(), 'export (1).geojson');
  if (!fs.existsSync(filePath)) {
    console.error('❌ export (1).geojson file not found at:', filePath);
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(rawData);

  const features: GeoJSONFeature[] = geojson.features || [];
  const totalRecords = features.length;
  let validRecordsCount = 0;
  let invalidRecordsCount = 0;
  let insertedCount = 0;
  let skippedDuplicatesCount = 0;
  let failedCount = 0;

  const validRecords: RestaurantRecord[] = [];
  const seenKeys = new Set<string>();

  for (const feature of features) {
    const props = feature.properties || {};
    const rawName = props.name ? String(props.name).trim() : null;
    const coords = getCoordinates(feature.geometry);

    if (!rawName || !coords) {
      invalidRecordsCount++;
      continue;
    }

    // Clean and normalize name
    const cleanName = rawName.replace(/\s+/g, ' ');

    // Address construction
    const street = props['addr:street'] || props['addr:suburb'] || props['addr:full'] || '';
    const city = props['addr:city'] || 'Lahore';
    const address = street ? `${street.trim()}, ${city}` : `${cleanName}, ${city}`;

    // Category determination
    let category = 'Dining & Restaurant';
    if (props.shop === 'bakery') category = 'Bakery & Pastry';
    else if (props.amenity === 'cafe') category = 'Cafe & Coffee';
    else if (props.amenity === 'fast_food') category = 'Fast Food';
    else if (props.cuisine) {
      const c = String(props.cuisine).trim();
      category = c.charAt(0).toUpperCase() + c.slice(1) + ' Cuisine';
    }

    // Unique ID generation per branch using deterministic UUID
    const rawId = feature.id || props['@id'] || `${cleanName}_${coords.lat}_${coords.lng}`;
    const cleanUuid = stringToUUID('osm_' + String(rawId));

    const lat = parseFloat(coords.lat.toFixed(6));
    const lng = parseFloat(coords.lng.toFixed(6));

    // Deduplication check by normalized name + lat + lng
    const dedupKey = `${cleanName.toLowerCase()}_${lat}_${lng}`;
    if (seenKeys.has(dedupKey)) {
      skippedDuplicatesCount++;
      continue;
    }
    seenKeys.add(dedupKey);

    const imageUrl = CATEGORY_IMAGES[category] || CATEGORY_IMAGES['Dining & Restaurant'];

    validRecords.push({
      id: cleanUuid,
      name: cleanName,
      category,
      address,
      image_url: imageUrl,
      latitude: lat,
      longitude: lng,
    });

    validRecordsCount++;
  }

  console.log(`📦 Valid records prepared: ${validRecords.length}. Inserting into Supabase in batches...`);

  // Batch insert into Supabase
  const BATCH_SIZE = 50;
  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('restaurants')
      .upsert(batch, { onConflict: 'id' })
      .select('id');

    if (error) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} insert error:`, error.message);
      failedCount += batch.length;
    } else {
      insertedCount += (data ? data.length : batch.length);
    }
  }

  console.log('\n==================================================');
  console.log('🎉 RESTAURANT IMPORT SUMMARY');
  console.log('==================================================');
  console.log(`Total JSON records:      ${totalRecords}`);
  console.log(`Valid records:           ${validRecordsCount}`);
  console.log(`Invalid records:         ${invalidRecordsCount}`);
  console.log(`Inserted / Upserted:     ${insertedCount}`);
  console.log(`Skipped duplicates:      ${skippedDuplicatesCount}`);
  console.log(`Failed:                  ${failedCount}`);
  console.log('==================================================');
  console.log('SAMPLE 5 IMPORTED RECORDS:');
  console.dir(validRecords.slice(0, 5), { depth: null });
  console.log('==================================================\n');
}

if (process.argv[1]?.includes('importRestaurants')) {
  runImport().catch(console.error);
}
