import React, { useContext } from "react";
import { PinContext, Text } from "../store";

function MetaInAppBrowserNotice({ className = '', ctaClassName = '' }) {
    const { inAppBrowser } = useContext(PinContext);

    if (!inAppBrowser?.isMetaInAppBrowser) {
        return null;
    }

    const bodyTid = inAppBrowser.platform === 'android'
        ? 'nearestTreeMetaBrowserBodyAndroid'
        : inAppBrowser.platform === 'ios'
            ? 'nearestTreeMetaBrowserBodyIos'
            : 'nearestTreeMetaBrowserBodyGeneric';
    const noticeClassName = ['metaBrowserNotice', className].filter(Boolean).join(' ');
    const actionClassName = ctaClassName || 'metaBrowserNotice__cta';

    return (
        <div className={noticeClassName}>
            <p className="metaBrowserNotice__lead"><Text tid="nearestTreeMetaBrowserLead" /></p>
            <p className="metaBrowserNotice__body"><Text tid={bodyTid} /></p>
            {inAppBrowser.openInExternalBrowserUrl ? (
                <a
                    className={actionClassName}
                    href={inAppBrowser.openInExternalBrowserUrl}
                >
                    <Text as="span" tid="nearestTreeMetaBrowserActionAndroid" />
                </a>
            ) : null}
        </div>
    );
}

export default MetaInAppBrowserNotice;
