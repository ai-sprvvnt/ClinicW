import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: RoomStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusStyles: Record<RoomStatus, string> = {
    Ocupado: "bg-red-500 text-white border-red-500",
    Apartado: "bg-amber-500 text-white border-amber-500",
    Desocupado: "bg-green-500 text-white border-green-500",
  };

  return (
    <Badge className={cn("font-bold", statusStyles[status])}>
      {status}
    </Badge>
  );
};
