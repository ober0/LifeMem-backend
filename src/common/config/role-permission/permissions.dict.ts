export const Permission = {
    UsersSearch: 'users.search',
    UsersAdminUpdate: 'users.admin-update',
    UsersAdminDelete: 'users.admin-delete',
    UsersAdminHardDelete: 'users.admin-hard-delete',

    RolesRead: 'roles.read',
    RolesCreate: 'roles.create',
    RolesUpdate: 'roles.update',
    RolesDelete: 'roles.delete',

    ServiceSettingsGetFull: 'service.settings.get-full',
    ServiceSettingsUpdate: 'service_settings.update',

    LogsRead: 'logs.read',
    AuthLogsRead: 'auth_logs.read',

    AiModelsRead: 'ai_models.read',
    AiModelsUpdate: 'ai_models.update'
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export const PERMISSIONS_BY_CATEGORY = {
    users: [
        Permission.UsersSearch,
        Permission.UsersAdminUpdate,
        Permission.UsersAdminDelete,
        Permission.UsersAdminHardDelete
    ],
    roles: [Permission.RolesRead, Permission.RolesCreate, Permission.RolesUpdate, Permission.RolesDelete],
    service_settings: [Permission.ServiceSettingsUpdate, Permission.ServiceSettingsGetFull],
    logs: [Permission.LogsRead],
    auth_logs: [Permission.AuthLogsRead],
    ai_models: [Permission.AiModelsRead, Permission.AiModelsUpdate]
} as const;

export type PermissionCategoryKey = keyof typeof PERMISSIONS_BY_CATEGORY;

export const ALL_PERMISSION_KEYS: PermissionKey[] = Object.values(Permission);

export const PERMISSION_CATEGORY_KEYS = Object.keys(PERMISSIONS_BY_CATEGORY) as PermissionCategoryKey[];
