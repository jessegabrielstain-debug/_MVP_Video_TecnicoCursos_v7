
import 'dotenv/config';
import { listNRTemplates } from '../estudio_ia_videos/app/lib/services/nr-templates-service';

async function test() {
  console.log('Testing listNRTemplates...');
  try {
    const templates = await listNRTemplates();
    console.log(`Found ${templates.length} templates.`);
    if (templates.length > 0) {
      console.log('First template:', templates[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
