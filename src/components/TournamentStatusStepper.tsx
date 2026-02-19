import { CheckCircle, Circle, Clock, Play, Users, UserCheck, Swords, Trophy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { key: "draft", label: "Draft", icon: Clock },
  { key: "registration_open", label: "Registration", icon: Users },
  { key: "registration_closed", label: "Reg. Closed", icon: XCircle },
  { key: "check_in", label: "Check-In", icon: UserCheck },
  { key: "in_progress", label: "In Progress", icon: Swords },
  { key: "completed", label: "Completed", icon: Trophy },
] as const;

interface TournamentStatusStepperProps {
  currentStatus: string;
  compact?: boolean;
}

export function TournamentStatusStepper({ currentStatus, compact = false }: TournamentStatusStepperProps) {
  const isCancelled = currentStatus === "cancelled";
  const currentIndex = STATUSES.findIndex(s => s.key === currentStatus);

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-sm bg-destructive/10 border border-destructive/30 px-4 py-3">
        <XCircle className="w-5 h-5 text-destructive" />
        <span className="font-heading text-sm text-destructive uppercase tracking-wider">Tournament Cancelled</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center w-full", compact ? "gap-1" : "gap-0")}>
      {STATUSES.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 transition-all",
                  compact ? "w-7 h-7" : "w-9 h-9",
                  isCompleted && "bg-primary border-primary",
                  isActive && "border-crimson bg-crimson/20 shadow-[0_0_12px_hsl(353_96%_45%/0.5)]",
                  !isCompleted && !isActive && "border-border bg-card"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className={cn("text-primary-foreground", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
                ) : (
                  <Icon className={cn(
                    compact ? "w-3.5 h-3.5" : "w-4 h-4",
                    isActive ? "text-crimson" : "text-muted-foreground"
                  )} />
                )}
              </div>
              {!compact && (
                <span className={cn(
                  "text-[10px] uppercase tracking-wider whitespace-nowrap",
                  isActive ? "text-crimson font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              )}
            </div>
            {i < STATUSES.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1",
                isCompleted ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
