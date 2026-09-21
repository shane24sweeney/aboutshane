import React, { createContext, useContext, useMemo } from 'react';

export const getEnvValue = (key, fallback = '') => {
  const value = process.env[key] || fallback;
  return value;
};

const defaultSiteState = {
  emailjs: {
    serviceId: getEnvValue('REACT_APP_EMAILJS_SERVICE_ID', 'service_p5dpxp5'),
    templateId: getEnvValue('REACT_APP_EMAILJS_TEMPLATE_ID', 'template_ye4bn4a'),
    publicKey: getEnvValue('REACT_APP_EMAILJS_PUBLIC_KEY', 'user_dheSXAbJ2Qf4yl2w7Fj62'),
  },
};

const SiteContext = createContext(defaultSiteState);

export const SiteProvider = ({ children }) => {
  const siteState = useMemo(() => ({
    emailjs: {
      serviceId: getEnvValue('REACT_APP_EMAILJS_SERVICE_ID', 'service_p5dpxp5'),
      templateId: getEnvValue('REACT_APP_EMAILJS_TEMPLATE_ID', 'template_ye4bn4a'),
      publicKey: getEnvValue('REACT_APP_EMAILJS_PUBLIC_KEY', 'user_dheSXAbJ2Qf4yl2w7Fj62'),
    },
  }), []);

  return <SiteContext.Provider value={siteState}>{children}</SiteContext.Provider>;
};

export const useSiteContext = () => useContext(SiteContext);
