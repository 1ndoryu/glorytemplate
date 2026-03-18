const liveReloadUrl = process.env.KAMPLES_CAP_SERVER_URL?.trim() || 'https://kamples.com';

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
    appId: 'com.kamples.mobile',
    appName: 'Kamples',
    webDir: 'www',
    android: {
        path: 'android'
    },
    server: liveReloadUrl ? {
        url: liveReloadUrl,
        cleartext: liveReloadUrl.startsWith('http://')
    } : undefined,
    plugins: {
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"],
        },
    }
};

module.exports = config;