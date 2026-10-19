import app from './app.js';
import env from './config/env.js';
import prisma from './config/prisma.js';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL database.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Healthcare Backend Server is running in [${env.NODE_ENV}] mode on http://localhost:${PORT}`);
      console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔒 HTTP server closed.');
        await prisma.$disconnect();
        console.log('💾 Database disconnected.');
        process.exit(0);
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        console.error('⚠️ Forcefully terminating process after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default startServer;
