import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mitr');

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  body: String,
  mood: String,
  isAnonymous: Boolean,
  createdAt: { type: Date, default: Date.now },
});
const Journal = mongoose.model('Journal', journalSchema);

const User = mongoose.model('User', new mongoose.Schema({ name: String }));

async function run() {
  const user = await User.findOne();
  if (user) {
    await Journal.create({
      userId: user._id,
      title: 'Test Journal',
      body: 'This is a test reflection',
      mood: 'happy',
      isAnonymous: false,
    });
    console.log('Journal created.');
  } else {
    console.log('No user found to create journal for.');
  }
  process.exit();
}
run();
