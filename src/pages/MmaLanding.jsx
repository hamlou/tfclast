import React from 'react';
import MmaHero from '../components/MmaHero';
import SEO from '../components/SEO';

const MmaLanding = () => {
  return (
    <>
      <SEO 
        title="TFC MMA - Elite Fighting Championship Platform" 
        description="Experience the future of MMA streaming with real-time fight stats, live events, and premium global access." 
      />
      <MmaHero />
    </>
  );
};

export default MmaLanding;