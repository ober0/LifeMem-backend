export enum NotificationType {
    LoginToAccount = 'LoginToAccount'
}

export const NotificationMessage = {
    LoginToAccount: {
        title: 'Вход в аккаунт',
        description: 'Выполнен вход в ваш аккаунт LifeMem'
    }
} as const;
