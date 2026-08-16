declare module 'apple-signin-auth' {
    const appleSignin: {
        verifyIdToken(
            idToken: string,
            options: { audience: string; ignoreExpiration?: boolean }
        ): Promise<{
            sub: string;
            email?: string;
            email_verified?: boolean | 'true' | 'false';
        }>;
    };
    export default appleSignin;
}
