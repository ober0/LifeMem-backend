import type { PermissionKey } from './permissions.dict';
import { ALL_PERMISSION_KEYS } from './permissions.dict';

export type RoleCatalogItem = {
    name: string;
    isDefault: boolean;
    permissions: readonly PermissionKey[];
};

export const ROLES_CATALOG: Record<string, RoleCatalogItem> = {
    admin: {
        name: 'admin',
        isDefault: false,
        permissions: ALL_PERMISSION_KEYS
    },
    user: {
        name: 'user',
        isDefault: true,
        permissions: []
    }
};
