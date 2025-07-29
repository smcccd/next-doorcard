// Public Page Types
import { DayOfWeek } from "@prisma/client";

export interface PublicDoorcard {
  id: string;
  name: string;
  doorcardName: string;
  officeNumber: string;
  term: string;
  year: number;
  college?: string;
  slug?: string;
  user: {
    name: string;
    username?: string;
    college?: string;
  };
  appointmentCount: number;
  availableDays: DayOfWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicDoorcardResponse {
  doorcards: PublicDoorcard[];
  success: boolean;
  error?: string;
}
