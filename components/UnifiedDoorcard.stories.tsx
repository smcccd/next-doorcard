import type { Meta, StoryObj } from '@storybook/react';
import UnifiedDoorcard, { type DoorcardLite, type AppointmentLite } from './UnifiedDoorcard';
import type { AppointmentCategory, DayOfWeek } from '@prisma/client';

// Mock appointment data
const mockAppointments: AppointmentLite[] = [
  {
    id: '1',
    name: 'Office Hours',
    startTime: '10:00',
    endTime: '12:00',
    dayOfWeek: 'MONDAY' as DayOfWeek,
    category: 'OFFICE_HOURS' as AppointmentCategory,
    location: 'Building 36, Room 301',
  },
  {
    id: '2',
    name: 'CS 101 - Introduction to Programming',
    startTime: '14:00',
    endTime: '15:30',
    dayOfWeek: 'MONDAY' as DayOfWeek,
    category: 'CLASS' as AppointmentCategory,
    location: 'Lab 12-108',
  },
  {
    id: '3',
    name: 'Office Hours',
    startTime: '10:00',
    endTime: '12:00',
    dayOfWeek: 'WEDNESDAY' as DayOfWeek,
    category: 'OFFICE_HOURS' as AppointmentCategory,
    location: 'Building 36, Room 301',
  },
  {
    id: '4',
    name: 'CS 201 - Data Structures',
    startTime: '09:00',
    endTime: '10:30',
    dayOfWeek: 'TUESDAY' as DayOfWeek,
    category: 'CLASS' as AppointmentCategory,
    location: 'Room 14-204',
  },
  {
    id: '5',
    name: 'CS 201 - Data Structures',
    startTime: '09:00',
    endTime: '10:30',
    dayOfWeek: 'THURSDAY' as DayOfWeek,
    category: 'CLASS' as AppointmentCategory,
    location: 'Room 14-204',
  },
  {
    id: '6',
    name: 'Department Meeting',
    startTime: '16:00',
    endTime: '17:00',
    dayOfWeek: 'FRIDAY' as DayOfWeek,
    category: 'MEETING' as AppointmentCategory,
    location: 'Conference Room A',
  },
];

const mockDoorcard: DoorcardLite = {
  name: 'Dr. Jane Smith',
  doorcardName: 'Professor Smith',
  officeNumber: '36-301',
  term: 'Spring',
  year: '2024',
  college: 'CSM',
  appointments: mockAppointments,
  user: {
    name: 'Dr. Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'Professor',
    pronouns: 'she/her',
    displayFormat: 'TITLE_FIRST_LAST',
    website: 'https://csm.edu/faculty/jsmith',
  },
};

const meta = {
  title: 'Components/UnifiedDoorcard',
  component: UnifiedDoorcard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showWeekendDays: {
      control: 'boolean',
      description: 'Whether to show Saturday and Sunday columns',
    },
    containerId: {
      control: 'text',
      description: 'Container ID for client-side functionality',
    },
  },
} satisfies Meta<typeof UnifiedDoorcard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    doorcard: mockDoorcard,
  },
};

export const WithWeekends: Story = {
  args: {
    doorcard: mockDoorcard,
    showWeekendDays: true,
  },
};

export const MinimalSchedule: Story = {
  args: {
    doorcard: {
      ...mockDoorcard,
      appointments: [
        {
          id: '1',
          name: 'Office Hours',
          startTime: '14:00',
          endTime: '16:00',
          dayOfWeek: 'TUESDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Room 301',
        },
        {
          id: '2',
          name: 'Office Hours',
          startTime: '14:00',
          endTime: '16:00',
          dayOfWeek: 'THURSDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Room 301',
        },
      ],
    },
  },
};

export const BusySchedule: Story = {
  args: {
    doorcard: {
      ...mockDoorcard,
      appointments: [
        // Monday
        {
          id: '1',
          name: 'CS 101',
          startTime: '08:00',
          endTime: '09:30',
          dayOfWeek: 'MONDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        {
          id: '2',
          name: 'Office Hours',
          startTime: '10:00',
          endTime: '12:00',
          dayOfWeek: 'MONDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
        },
        {
          id: '3',
          name: 'CS 201',
          startTime: '14:00',
          endTime: '15:30',
          dayOfWeek: 'MONDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        // Tuesday
        {
          id: '4',
          name: 'CS 101',
          startTime: '08:00',
          endTime: '09:30',
          dayOfWeek: 'TUESDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        {
          id: '5',
          name: 'Committee Meeting',
          startTime: '11:00',
          endTime: '12:00',
          dayOfWeek: 'TUESDAY' as DayOfWeek,
          category: 'MEETING' as AppointmentCategory,
        },
        {
          id: '6',
          name: 'Student Conferences',
          startTime: '13:00',
          endTime: '15:00',
          dayOfWeek: 'TUESDAY' as DayOfWeek,
          category: 'APPOINTMENT' as AppointmentCategory,
        },
        // Wednesday
        {
          id: '7',
          name: 'CS 101',
          startTime: '08:00',
          endTime: '09:30',
          dayOfWeek: 'WEDNESDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        {
          id: '8',
          name: 'Office Hours',
          startTime: '10:00',
          endTime: '12:00',
          dayOfWeek: 'WEDNESDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
        },
        {
          id: '9',
          name: 'CS 201',
          startTime: '14:00',
          endTime: '15:30',
          dayOfWeek: 'WEDNESDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        // Thursday
        {
          id: '10',
          name: 'CS 101',
          startTime: '08:00',
          endTime: '09:30',
          dayOfWeek: 'THURSDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        {
          id: '11',
          name: 'Research Time',
          startTime: '10:00',
          endTime: '12:00',
          dayOfWeek: 'THURSDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
        },
        // Friday
        {
          id: '12',
          name: 'CS 201',
          startTime: '08:00',
          endTime: '09:30',
          dayOfWeek: 'FRIDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
        },
        {
          id: '13',
          name: 'Faculty Meeting',
          startTime: '15:00',
          endTime: '16:30',
          dayOfWeek: 'FRIDAY' as DayOfWeek,
          category: 'MEETING' as AppointmentCategory,
        },
      ],
    },
  },
};

export const DifferentColleges: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-4">College of San Mateo</h3>
        <UnifiedDoorcard doorcard={{ ...mockDoorcard, college: 'CSM' }} />
      </div>
      <div>
        <h3 className="font-semibold mb-4">Skyline College</h3>
        <UnifiedDoorcard doorcard={{ ...mockDoorcard, college: 'SKYLINE' }} />
      </div>
      <div>
        <h3 className="font-semibold mb-4">Cañada College</h3>
        <UnifiedDoorcard doorcard={{ ...mockDoorcard, college: 'CANADA' }} />
      </div>
    </div>
  ),
};

export const PrintLayout: Story = {
  parameters: {
    docs: {
      description: {
        story: 'This shows how the doorcard appears when printed. The print styles optimize the layout for physical printing.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="print:p-0">
        <style>{`
          @media print {
            .print\\:p-0 { padding: 0 !important; }
            .print\\:m-0 { margin: 0 !important; }
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
  args: {
    doorcard: mockDoorcard,
  },
};

export const EmptySchedule: Story = {
  args: {
    doorcard: {
      ...mockDoorcard,
      appointments: [],
    },
  },
};

export const OnlyOfficeHours: Story = {
  args: {
    doorcard: {
      ...mockDoorcard,
      appointments: [
        {
          id: '1',
          name: 'Office Hours',
          startTime: '10:00',
          endTime: '12:00',
          dayOfWeek: 'MONDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Building 36, Room 301',
        },
        {
          id: '2',
          name: 'Office Hours',
          startTime: '14:00',
          endTime: '16:00',
          dayOfWeek: 'WEDNESDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Building 36, Room 301',
        },
        {
          id: '3',
          name: 'Office Hours',
          startTime: '09:00',
          endTime: '11:00',
          dayOfWeek: 'FRIDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Building 36, Room 301',
        },
      ],
    },
  },
};

export const LongNames: Story = {
  args: {
    doorcard: {
      ...mockDoorcard,
      name: 'Dr. Christopher Alexander Johnson III',
      doorcardName: 'Professor Christopher Alexander Johnson III, PhD',
      officeNumber: 'Building 36, Room 301A',
      appointments: [
        {
          id: '1',
          name: 'Advanced Software Engineering and Database Systems',
          startTime: '10:00',
          endTime: '12:00',
          dayOfWeek: 'MONDAY' as DayOfWeek,
          category: 'CLASS' as AppointmentCategory,
          location: 'Computer Science Laboratory Building 12, Room 108',
        },
        {
          id: '2',
          name: 'Extended Office Hours for Student Consultations',
          startTime: '14:00',
          endTime: '16:00',
          dayOfWeek: 'WEDNESDAY' as DayOfWeek,
          category: 'OFFICE_HOURS' as AppointmentCategory,
          location: 'Faculty Office Building 36, Room 301A',
        },
      ],
    },
  },
};

export const ResponsiveView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    doorcard: mockDoorcard,
  },
};