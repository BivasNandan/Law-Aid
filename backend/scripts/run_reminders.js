import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { runRemindersNow } from '../utils/reminderScheduler.js';

dotenv.config();

async function main() {
  try {
    await connectDB();

    // Minimal mock io that logs emits so the scheduler can run outside the server
    const io = {
      to(room) {
        return {
          emit(event, payload) {
            console.log(`[mockIO] emit -> room: ${room}, event: ${event}, payloadId: ${payload && payload._id}`);
          }
        }
      }
    };

    console.log('Running reminder scan now...');
    await runRemindersNow(io, 15);
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to run reminders script:', err);
    process.exit(1);
  }
}

main();
