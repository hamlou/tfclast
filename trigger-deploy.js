// Trigger deployment via webhook
import fetch from 'node-fetch';

const BACKEND_URL = 'https://tfc.events';
const DEPLOY_SECRET = 'tfc-deploy-2026'; // Change this in production

async function triggerDeploy() {
  console.log('🚀 Triggering deployment on VPS...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: DEPLOY_SECRET })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Deployment successful!');
      console.log(data);
    } else {
      console.error('❌ Deployment failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerDeploy();
