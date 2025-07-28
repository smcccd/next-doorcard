import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.ONELOGIN_CLIENT_ID;
    delete process.env.npm_package_version;
  });

  describe('GET', () => {
    it('should return healthy status when database is connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.ONELOGIN_CLIENT_ID = 'test-client';
      process.env.npm_package_version = '1.0.0';

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
      expect(data.checks.database).toBe('✅ Connected');
      expect(data.checks.auth).toBe('✅ Configured');
      expect(data.checks.onelogin).toBe('✅ Configured');
      expect(data.version).toBe('1.0.0');
    });

    it('should return unhealthy status when database fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('unhealthy');
      expect(data.database).toBe('disconnected');
      expect(data.error).toBe('Database connection failed');
    });

    it('should show missing auth configuration', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      // No NEXTAUTH_SECRET set

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checks.auth).toBe('❌ Missing');
    });

    it('should show onelogin not configured', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      process.env.NEXTAUTH_SECRET = 'test-secret';
      // No ONELOGIN_CLIENT_ID set

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checks.onelogin).toBe('⚠️ Not configured');
    });

    it('should handle unknown version', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      // No npm_package_version set

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe('unknown');
    });

    it('should include uptime and timestamp', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.uptime).toBe('number');
      expect(typeof data.timestamp).toBe('string');
      expect(data.environment).toBe(process.env.NODE_ENV);
    });

    it('should handle non-Error exceptions', async () => {
      mockPrisma.$queryRaw.mockRejectedValue('String error');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Unknown error');
    });
  });
});