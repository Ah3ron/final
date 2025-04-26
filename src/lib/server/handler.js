import { SvelteKitHandler } from '@sveltejs/kit/node';
import { manifest } from '$lib/server/manifest.js';

// Create SvelteKit handler
export const handler = SvelteKitHandler({ manifest });

// Export for use in other files
export default handler;
