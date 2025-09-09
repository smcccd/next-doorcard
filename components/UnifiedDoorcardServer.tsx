// Legacy server component wrapper for backward compatibility
import { UnifiedDoorcard } from "./UnifiedDoorcard";
import type { DoorcardLite } from "./UnifiedDoorcard";

interface UnifiedDoorcardServerProps {
  doorcard: DoorcardLite;
  showWeekendDays?: boolean;
  containerId?: string;
}

export function UnifiedDoorcardServer({
  doorcard,
  showWeekendDays = false,
  containerId = "doorcard-schedule",
}: UnifiedDoorcardServerProps) {
  return (
    <UnifiedDoorcard
      doorcard={doorcard}
      showWeekendDays={showWeekendDays}
      containerId={containerId}
      defaultView="week"
      showViewToggle={true}
    />
  );
}

export default UnifiedDoorcardServer;
