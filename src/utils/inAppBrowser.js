function getUserAgent() {
    if (typeof navigator === 'undefined') {
        return '';
    }

    return navigator.userAgent || '';
}

export function getInAppBrowserInfo() {
    const userAgent = getUserAgent();
    const isMetaInAppBrowser = /FBAN|FBAV|Messenger/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    let openInExternalBrowserUrl = null;

    if (isMetaInAppBrowser && isAndroid && typeof window !== 'undefined') {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const scheme = url.protocol.replace(':', '');
        const intentTarget = `${url.host}${url.pathname}${url.search}${url.hash}`;

        openInExternalBrowserUrl =
            `intent://${intentTarget}#Intent;scheme=${scheme};package=com.android.chrome;` +
            `S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
    }

    return {
        isMetaInAppBrowser,
        platform: isAndroid ? 'android' : isIOS ? 'ios' : 'other',
        openInExternalBrowserUrl
    };
}
