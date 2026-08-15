import { PrismaClient } from '@prisma/client';
import {
    ALL_PERMISSION_KEYS,
    PERMISSION_CATEGORY_KEYS,
    PERMISSIONS_BY_CATEGORY,
    ROLES_CATALOG
} from '../../src/common/config/role-permission';

export async function seedRolesPermissions(prisma: PrismaClient): Promise<void> {
    const catalogPermissionKeys = new Set<string>(ALL_PERMISSION_KEYS);
    const catalogCategoryKeys = new Set<string>(PERMISSION_CATEGORY_KEYS);
    const catalogRoleNames = new Set(Object.values(ROLES_CATALOG).map((role) => role.name));

    const categoryIdByKey = new Map<string, string>();
    const permissionIdByKey = new Map<string, string>();

    for (const categoryKey of PERMISSION_CATEGORY_KEYS) {
        const category = await prisma.permissionCategory.upsert({
            where: { key: categoryKey },
            create: { key: categoryKey },
            update: {}
        });
        categoryIdByKey.set(categoryKey, category.id);

        for (const permissionKey of PERMISSIONS_BY_CATEGORY[categoryKey]) {
            const permission = await prisma.permission.upsert({
                where: { key: permissionKey },
                create: {
                    key: permissionKey,
                    permissionCategoryId: category.id
                },
                update: {
                    permissionCategoryId: category.id
                }
            });
            permissionIdByKey.set(permissionKey, permission.id);
        }
    }

    const missingInCategories = ALL_PERMISSION_KEYS.filter((key) => !permissionIdByKey.has(key));
    if (missingInCategories.length > 0) {
        throw new Error(
            `[seed:rbac] permissions не попали в PERMISSIONS_BY_CATEGORY: ${missingInCategories.join(', ')}`
        );
    }

    for (const roleDef of Object.values(ROLES_CATALOG)) {
        const role = await prisma.role.upsert({
            where: { name: roleDef.name },
            create: {
                name: roleDef.name,
                isDefault: roleDef.isDefault
            },
            update: {
                isDefault: roleDef.isDefault
            }
        });

        const desiredPermissionIds = new Set<string>();

        for (const permissionKey of roleDef.permissions) {
            const permissionId = permissionIdByKey.get(permissionKey);
            if (!permissionId) {
                throw new Error(`[seed:rbac] неизвестный permission: ${permissionKey}`);
            }

            desiredPermissionIds.add(permissionId);

            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId
                    }
                },
                create: {
                    roleId: role.id,
                    permissionId
                },
                update: {}
            });
        }

        await prisma.rolePermission.deleteMany({
            where: {
                roleId: role.id,
                permissionId: {
                    notIn: [...desiredPermissionIds]
                }
            }
        });
    }

    await prisma.permission.deleteMany({
        where: {
            key: {
                notIn: [...catalogPermissionKeys]
            }
        }
    });

    await prisma.permissionCategory.deleteMany({
        where: {
            key: {
                notIn: [...catalogCategoryKeys]
            }
        }
    });

    await prisma.role.deleteMany({
        where: {
            name: {
                notIn: [...catalogRoleNames]
            },
            users: {
                none: {}
            }
        }
    });

    console.log('[seed:rbac] роли, категории и права синхронизированы');
}
