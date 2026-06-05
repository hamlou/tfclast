// Simple deployment webhook endpoint
// This allows you to trigger deployment via HTTP request

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const deployWebhook = async (req, res) => {
  const { secret } = req.body;
  
  // Security: require secret token
  if (secret !== process.env.DEPLOY_SECRET) {
    return res.status(403).json({ error: 'Invalid deploy secret' });
  }

  try {
    console.log('🚀 Starting deployment...');
    
    // Run deployment commands
    const commands = [
      'cd /var/www/tfc',
      'git pull origin master',
      'npm run build',
      'pm2 restart tfc-backend'
    ].join(' && ');

    const { stdout, stderr } = await execAsync(commands);
    
    console.log('✅ Deployment complete!');
    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    res.json({ 
      success: true, 
      message: 'Deployment completed successfully',
      output: stdout 
    });
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    res.status(500).json({ 
      error: 'Deployment failed', 
      message: error.message 
    });
  }
};
