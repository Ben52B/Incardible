const cron = require('node-cron');
const TemplateData = require('../models/templateData');

const deleteTemporaryTemplateData = async () => {
    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const result = await TemplateData.deleteMany({
            createdAt: { $lt: oneWeekAgo }
        });

        console.log(`Deleted ${result.deletedCount} old template data entries.`);
    } catch (error) {
        console.error('Error during weekly template data cleanup:', error);
    }
};

// Run the cron job weekly (every Sunday at midnight)
cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly cleanup task...');
    await deleteTemporaryTemplateData();
});
