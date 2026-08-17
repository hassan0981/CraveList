import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drfn0aw1t';
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '975422384962753';
const CLOUDINARY_API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET || '38thUoRSkpnPKsbcktPf4CO-qH0';

function sha1(str: string): string {
  let rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  let cvtHex = (val: number) => {
    let hexStr = '';
    for (let i = 7; i >= 0; i--) {
      let v = (val >>> (i * 4)) & 0x0f;
      hexStr += v.toString(16);
    }
    return hexStr;
  };
  let block: number[] = [];
  let strlen = str.length;
  for (let i = 0; i < strlen; i++) {
    block[i >> 2] |= str.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  block[strlen >> 2] |= 0x80 << (24 - (strlen % 4) * 8);
  block[(((strlen + 8) >> 6) << 4) + 15] = strlen * 8;

  let H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  let W = new Array(80);

  for (let i = 0; i < block.length; i += 16) {
    for (let t = 0; t < 16; t++) W[t] = block[i + t] || 0;
    for (let t = 16; t < 80; t++) W[t] = rotateLeft(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);

    let [a, b, c, d, e] = H;

    for (let t = 0; t < 80; t++) {
      let f: number, k: number;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }

      let temp = (rotateLeft(a, 5) + f + e + k + W[t]) & 0xffffffff;
      e = d; d = c; c = rotateLeft(b, 30) & 0xffffffff; b = a; a = temp;
    }

    H[0] = (H[0] + a) & 0xffffffff;
    H[1] = (H[1] + b) & 0xffffffff;
    H[2] = (H[2] + c) & 0xffffffff;
    H[3] = (H[3] + d) & 0xffffffff;
    H[4] = (H[4] + e) & 0xffffffff;
  }

  return H.map(cvtHex).join('');
}

export const cloudinaryService = {
  /**
   * Request media library permissions and pick an image from gallery.
   */
  async pickImageFromGallery(): Promise<{ uri: string; base64?: string } | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access photo gallery is required.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          base64: asset.base64 || undefined,
        };
      }
      return null;
    } catch (err) {
      console.error('[cloudinaryService] Error picking image from gallery:', err);
      return null;
    }
  },

  /**
   * Request camera permissions and take a photo using camera.
   */
  async takePhotoWithCamera(): Promise<{ uri: string; base64?: string } | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access camera is required.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          base64: asset.base64 || undefined,
        };
      }
      return null;
    } catch (err) {
      console.error('[cloudinaryService] Error taking photo:', err);
      return null;
    }
  },

  /**
   * Signed upload an image to Cloudinary CDN and return the secure image URL.
   */
  async uploadImage(imageUri: string, base64Data?: string): Promise<string> {
    if (!imageUri) return '';

    try {
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = sha1(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`);

      const formData = new FormData();

      if (base64Data) {
        formData.append('file', `data:image/jpeg;base64,${base64Data}`);
      } else {
        const filename = imageUri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      }

      formData.append('api_key', CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data && data.secure_url) {
        console.log('[cloudinaryService] Cloudinary Upload Success:', data.secure_url);
        return data.secure_url;
      } else if (data && data.url) {
        return data.url;
      }

      console.warn('[cloudinaryService] Cloudinary upload response missing secure_url:', data);
      return imageUri;
    } catch (err) {
      console.warn('[cloudinaryService] Upload error, using fallback URI:', err);
      return imageUri;
    }
  },
};

export default cloudinaryService;
