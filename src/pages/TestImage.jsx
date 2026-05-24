import React from 'react';
import SEO from '../components/SEO';

const TestImage = () => {
  // Try to import the image directly
  const imageUrl = '/Screenshot 2026-01-30 231135.png';
  
  return (
    <div className="min-h-screen bg-black">
      <SEO 
        title="Test Image" 
        description="Testing image loading" 
      />
      
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-white text-3xl mb-8">Image Test Page</h1>
        
        <div className="w-full max-w-4xl h-96 relative border-4 border-white">
          <img 
            src={imageUrl} 
            alt="Test MMA Platform"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Test image failed to load:', e);
              console.log('Attempting to load image from:', imageUrl);
              // Try a fallback image
              e.target.src = 'https://placehold.co/800x400/ff0000/ffffff?text=Image+Failed+to+Load';
            }}
            onLoad={(e) => {
              console.log('Image loaded successfully from:', imageUrl);
              console.log('Image natural dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
            }}
          />
        </div>
        
        <p className="text-white mt-4">If you see the MMA screenshot above, the image is working.</p>
        <p className="text-gray-400">Check browser console for any error messages.</p>
        
        <div className="mt-8 p-4 bg-gray-800 rounded">
          <p className="text-white">Debug Info:</p>
          <p className="text-gray-300 text-sm">Image URL: {imageUrl}</p>
          <p className="text-gray-300 text-sm">Current time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default TestImage;