import { render, screen } from '@testing-library/react';
import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import PublicDoorcardView from '../page';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('next/navigation');
jest.mock('@/lib/prisma');
jest.mock('@/lib/auth');

// Mock components
jest.mock('@/components/UnifiedDoorcard', () => ({
  UnifiedDoorcard: ({ doorcard }: any) => (
    <div data-testid="unified-doorcard">
      Doorcard for {doorcard.name}
    </div>
  ),
}));

jest.mock('@/components/PrintOptimizedDoorcard', () => ({
  PrintOptimizedDoorcard: ({ doorcard }: any) => (
    <div data-testid="print-optimized-doorcard">
      Print version for {doorcard.name}
    </div>
  ),
}));

jest.mock('@/components/UnifiedDoorcardActions', () => ({
  DoorcardActions: ({ doorcard }: any) => (
    <div data-testid="doorcard-actions">Actions for {doorcard.name}</div>
  ),
}));

jest.mock('@/components/doorcard/DoorcardViewTracker', () => ({
  DoorcardViewTracker: (props: any) => (
    <div data-testid="view-tracker" data-doorcard-id={props.doorcardId} />
  ),
}));

jest.mock('@/components/AutoPrintHandler', () => ({
  AutoPrintHandler: ({ autoPrint }: any) => (
    <div data-testid="auto-print-handler" data-auto-print={autoPrint} />
  ),
}));

jest.mock('@/lib/display-name', () => ({
  formatDisplayName: (user: any) => `${user.firstName} ${user.lastName}`,
}));

// Mock UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <div {...props}>{children}</div>;
    }
    return <button {...props}>{children}</button>;
  },
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Building: () => <div data-testid="building-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockPrisma = prisma as any;

describe('PublicDoorcardView', () => {
  const mockDoorcard = {
    id: 'doorcard-1',
    name: 'Dr. John Smith',
    doorcardName: 'Professor John Smith',
    officeNumber: '123',
    term: 'Fall',
    year: '2024',
    college: 'SKYLINE',
    isActive: true,
    isPublic: true,
    slug: 'john-smith-fall-2024',
    userId: 'user-1',
    appointments: [
      {
        id: 'appt-1',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        appointmentType: 'Office Hours',
      },
    ],
    user: {
      name: 'Dr. John Smith',
      firstName: 'John',
      lastName: 'Smith',
      title: 'Professor',
      pronouns: 'he/him',
      displayFormat: 'FULL_NAME_TITLE',
      college: 'SKYLINE',
      website: 'https://example.com',
    },
  };

  const mockUser = {
    id: 'user-1',
    name: 'Dr. John Smith',
    college: 'SKYLINE',
    email: 'john@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(null);
    mockPrisma.user = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    };
    mockPrisma.doorcard = {
      findFirst: jest.fn(),
    };
  });

  it('renders doorcard view with all components when doorcard is found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Professor John Smith')).toBeInTheDocument();
    expect(screen.getByText('Office 123')).toBeInTheDocument();
    expect(screen.getByText('Fall 2024')).toBeInTheDocument();
    expect(screen.getByText('SKYLINE')).toBeInTheDocument();
    expect(screen.getByTestId('unified-doorcard')).toBeInTheDocument();
    expect(screen.getByTestId('view-tracker')).toBeInTheDocument();
  });

  it('shows admin view badge when auth=true', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@example.com' },
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({ auth: 'true' });

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Admin View')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows specific term badge when term slug is provided', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith', 'fall-2024'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    // There are multiple "Fall 2024" texts - one in badge, one in info section
    const fallTexts = screen.getAllByText('Fall 2024');
    expect(fallTexts.length).toBeGreaterThan(0);
  });

  it('shows auto print handler when print=true', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({ print: 'true' });

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    const autoPrintHandler = screen.getByTestId('auto-print-handler');
    expect(autoPrintHandler).toHaveAttribute('data-auto-print', 'true');
  });

  it('renders error page when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const params = Promise.resolve({ slug: ['nonexistent-user'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Doorcard Not Available')).toBeInTheDocument();
    expect(screen.getByText('Doorcard not found')).toBeInTheDocument();
    expect(screen.getByText('Browse Doorcards')).toBeInTheDocument();
  });

  it('renders error page when doorcard is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(null);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Doorcard Not Available')).toBeInTheDocument();
    expect(screen.getByText('Doorcard not found')).toBeInTheDocument();
  });

  it('renders error page when doorcard is private and no auth', async () => {
    const privateDoorcard = { ...mockDoorcard, isPublic: false };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(privateDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Doorcard Not Available')).toBeInTheDocument();
    expect(screen.getByText('This doorcard is not publicly accessible')).toBeInTheDocument();
  });

  it('allows viewing private doorcard with auth=true and valid session', async () => {
    const privateDoorcard = { ...mockDoorcard, isPublic: false };
    mockGetServerSession.mockResolvedValue({
      user: { email: 'admin@example.com' },
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(privateDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({ auth: 'true' });

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Professor John Smith')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows draft badge for inactive doorcards', async () => {
    const draftDoorcard = { ...mockDoorcard, isActive: false };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(draftDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows no appointments message when appointments array is empty', async () => {
    const doorcardWithoutAppointments = { ...mockDoorcard, appointments: [] };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(doorcardWithoutAppointments);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('No scheduled appointments or office hours.')).toBeInTheDocument();
  });

  it('calls notFound when slug array is empty', async () => {
    mockNotFound.mockImplementation(() => {
      throw new Error('notFound called');
    });

    const params = Promise.resolve({ slug: [] });
    const searchParams = Promise.resolve({});

    await expect(PublicDoorcardView({ params, searchParams })).rejects.toThrow('notFound called');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('falls back to name-based search when username not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { equals: 'john smith', mode: 'insensitive' } },
          { name: { equals: 'John Smith', mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, college: true, email: true },
    });
  });

  it('shows faculty website link when available', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.doorcard.findFirst.mockResolvedValue(mockDoorcard);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({});

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    const websiteLink = screen.getByText('Faculty Website');
    expect(websiteLink).toBeInTheDocument();
    expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('requires authentication for auth=true without valid session', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const params = Promise.resolve({ slug: ['john-smith'] });
    const searchParams = Promise.resolve({ auth: 'true' });

    const result = await PublicDoorcardView({ params, searchParams });
    render(result);

    expect(screen.getByText('Doorcard Not Available')).toBeInTheDocument();
    expect(screen.getByText('Authentication required')).toBeInTheDocument();
  });
});