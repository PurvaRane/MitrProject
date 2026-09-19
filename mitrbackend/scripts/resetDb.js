import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetDatabase = async () => {
  const args = process.argv.slice(2);
  const isConfirm = args.includes('--confirm');

  console.log('===========================================================');
  console.log('⚠️  COEP "मित्र" DATABASE RESET TOOL ⚠️');
  console.log('===========================================================');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
  }

  // Safety check
  if (mongoUri.includes('production') || mongoUri.includes('prod')) {
    console.error('❌ ERROR: This looks like a PRODUCTION database. Reset aborted.');
    process.exit(1);
  }

  console.log(`Target Database Connection: ${mongoUri.split('@')[1] || mongoUri}`);

  if (!isConfirm) {
    console.log('');
    console.log('This will PERMANENTLY DELETE all content data (Users, Appointments, Challenges, Events, etc).');
    console.log('Schemas and indexes will be preserved.');
    console.log('');
    console.log('To execute this operation, run:');
    console.log('  npm run db:reset -- --confirm');
    console.log('===========================================================');
    process.exit(0);
  }

  console.log('\n🔄 Connecting to database...');
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    const modelsDir = path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
    
    console.log('\n🧹 Dropping collections...');
    
    for (const file of modelFiles) {
      const modelPath = path.join('file://', modelsDir, file);
      const { default: Model } = await import(modelPath);
      
      try {
        const result = await Model.deleteMany({});
        console.log(`  - Deleted ${result.deletedCount} documents from ${Model.collection.name}`);
      } catch (err) {
        console.error(`  - Failed to delete from ${Model.collection.name}: ${err.message}`);
      }
    }

    console.log('\n✅ Database reset complete! All test/application data cleared.');
    console.log('Note: Admin credentials are hardcoded, so the Admin account remains accessible.');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error during reset: ${error.message}`);
    process.exit(1);
  }
};

resetDatabase();
