import { useEffect, useState } from 'react';
import { setConsent, shouldAskForConsent, storedConsent } from '../analytics/analytics';
import './ConsentBanner.css';

/** Fired by the footer's "Cookie settings" button to show the banner again. */
export const OPEN_COOKIE_SETTINGS = 'aboutshane:cookie-settings';

/**
 * Asks visitors in Europe before any analytics storage, and lets anyone change their mind later
 * from the footer. Non-blocking: the page stays usable while it shows.
 */
function ConsentBanner() {
  const [open, setOpen] = useState(shouldAskForConsent);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  if (!open) return null;
  const current = storedConsent();
  const choose = (choice: 'granted' | 'denied') => {
    setConsent(choice);
    setOpen(false);
  };

  return (
    <section className="consent-banner" role="region" aria-label="Cookie consent">
      <p>
        This site uses Google Analytics cookies to count visits by country and to measure how fast pages load. No ads, and
        nothing is sold or shared for marketing.
        {current && <span className="consent-current"> You currently {current === 'granted' ? 'allow' : 'decline'} them.</span>}
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-accept" onClick={() => choose('granted')}>
          Accept analytics
        </button>
        <button type="button" className="consent-decline" onClick={() => choose('denied')}>
          Decline
        </button>
      </div>
    </section>
  );
}

export default ConsentBanner;
