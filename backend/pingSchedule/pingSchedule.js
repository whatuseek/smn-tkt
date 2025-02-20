// tkt/backend/pingSchedule/pingSchedule.js
import axios from 'axios';
// import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const pingSelf = async () => {
  try {
    // Get the app URL from environment variables, with a default value
    const appUrl = process.env.APP_URL || 'http://localhost:5000';

    // Ping the application
    const response = await axios.get(`${appUrl}/ping`);

    // Check the results
    if (response.status === 200) {
      console.log(`Successfully pinged the app at ${appUrl}/ping`);
    } else {
      console.log(`Pinging ${appUrl}/ping failed with status code: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error pinging app:`, error.message);
  }
};

export default pingSelf;