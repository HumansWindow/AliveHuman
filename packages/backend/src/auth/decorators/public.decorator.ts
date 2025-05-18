import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes as public (no auth required)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
