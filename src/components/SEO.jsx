import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description }) => {
  const siteTitle = 'TFC | The Future of Content';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'The premier streaming platform for global events and exclusive entertainment.'} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="theme-color" content="#121212" />
    </Helmet>
  );
};

export default SEO;
