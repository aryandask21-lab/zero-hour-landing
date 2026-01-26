import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, Check, MapPin, Shield, Swords, Crosshair } from "lucide-react";

interface Map {
  id: string;
  map_name: string;
  map_image_url: string | null;
  game: string;
}

interface MatchMap {
  id: string;
  map_id: string;
  map_order: number;
  picked_by: string | null;
  banned_by: string | null;
  is_decider: boolean;
  team1_side: string | null;
  status: string;
  map?: Map;
}

interface MapVetoProps {
  matchId: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  matchFormat: "bo1" | "bo3" | "bo5";
  isParticipant: boolean;
  currentTeamId?: string;
  onComplete?: () => void;
}

type VetoAction = "ban" | "pick" | "decider";

interface VetoStep {
  team: "team1" | "team2";
  action: VetoAction;
}

// Veto sequences for different formats
const VETO_SEQUENCES: Record<string, VetoStep[]> = {
  bo1: [
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "decider" }, // Last map is played
  ],
  bo3: [
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "pick" },
    { team: "team2", action: "pick" },
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "decider" }, // Last map is decider
  ],
  bo5: [
    { team: "team1", action: "ban" },
    { team: "team2", action: "ban" },
    { team: "team1", action: "pick" },
    { team: "team2", action: "pick" },
    { team: "team1", action: "pick" },
    { team: "team2", action: "pick" },
    { team: "team1", action: "decider" }, // Last map is decider
  ],
};

export function MapVeto({
  matchId,
  tournamentId,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  matchFormat,
  isParticipant,
  currentTeamId,
  onComplete,
}: MapVetoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maps, setMaps] = useState<Map[]>([]);
  const [matchMaps, setMatchMaps] = useState<MatchMap[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [selectedSide, setSelectedSide] = useState<"attack" | "defense" | null>(null);

  const vetoSequence = VETO_SEQUENCES[matchFormat] || VETO_SEQUENCES.bo1;

  useEffect(() => {
    fetchMaps();
    subscribeToChanges();
  }, [matchId, tournamentId]);

  const fetchMaps = async () => {
    // First get tournament map pool
    const { data: poolData } = await supabase
      .from("tournament_map_pool")
      .select(`map:map_pool(*)`)
      .eq("tournament_id", tournamentId);

    let mapList: Map[] = [];

    if (poolData && poolData.length > 0) {
      mapList = poolData.map(p => p.map).filter(Boolean) as Map[];
    } else {
      // Fallback to default map pool
      const { data: defaultMaps } = await supabase
        .from("map_pool")
        .select("*")
        .eq("is_active", true);
      
      mapList = defaultMaps || [];
    }

    // Get current match maps state
    const { data: matchMapData } = await supabase
      .from("match_maps")
      .select(`*, map:map_pool(*)`)
      .eq("match_id", matchId)
      .order("map_order", { ascending: true });

    setMaps(mapList);
    setMatchMaps(matchMapData || []);

    // Calculate current step based on bans/picks
    const actionsCount = (matchMapData || []).filter(
      m => m.banned_by || m.picked_by
    ).length;
    setCurrentStep(actionsCount);

    setIsLoading(false);
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel(`match_maps_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_maps",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchMaps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getCurrentTurn = () => {
    if (currentStep >= vetoSequence.length) return null;
    const step = vetoSequence[currentStep];
    return {
      teamId: step.team === "team1" ? team1Id : team2Id,
      teamName: step.team === "team1" ? team1Name : team2Name,
      action: step.action,
      isMyTurn: currentTeamId === (step.team === "team1" ? team1Id : team2Id),
    };
  };

  const getAvailableMaps = () => {
    const usedMapIds = matchMaps.map(m => m.map_id);
    return maps.filter(m => !usedMapIds.includes(m.id));
  };

  const handleMapAction = async (mapId: string) => {
    const turn = getCurrentTurn();
    if (!turn || !turn.isMyTurn || isActing) return;

    setIsActing(true);

    try {
      const mapOrder = matchMaps.length + 1;
      
      const insertData = {
        match_id: matchId,
        map_id: mapId,
        map_order: mapOrder,
        status: "pending" as const,
        banned_by: turn.action === "ban" ? currentTeamId : null,
        picked_by: (turn.action === "pick" || turn.action === "decider") ? currentTeamId : null,
        is_decider: turn.action === "decider",
        team1_side: (turn.action !== "ban" && selectedSide) 
          ? (currentTeamId === team1Id ? selectedSide : (selectedSide === "attack" ? "defense" : "attack"))
          : null,
      };

      const { error } = await supabase.from("match_maps").insert(insertData);

      if (error) throw error;

      toast({
        title: turn.action === "ban" ? "Map Banned" : "Map Picked",
        description: `${maps.find(m => m.id === mapId)?.map_name} has been ${turn.action === "ban" ? "banned" : "picked"}`,
      });

      // Check if veto is complete
      if (currentStep + 1 >= vetoSequence.length) {
        onComplete?.();
      }
    } catch (error) {
      console.error("Error with map action:", error);
      toast({
        title: "Error",
        description: "Failed to complete action",
        variant: "destructive",
      });
    } finally {
      setIsActing(false);
      setSelectedSide(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-crimson">Loading map veto...</div>
      </div>
    );
  }

  const turn = getCurrentTurn();
  const availableMaps = getAvailableMaps();
  const isVetoComplete = currentStep >= vetoSequence.length;

  // Get picked maps for final display
  const pickedMaps = matchMaps.filter(m => m.picked_by);

  return (
    <div className="space-y-6">
      {/* Veto Header */}
      <div className="text-center">
        <h3 className="font-heading text-2xl text-white mb-2">MAP VETO</h3>
        <p className="text-muted-foreground text-sm">
          {matchFormat.toUpperCase()} • {team1Name} vs {team2Name}
        </p>
      </div>

      {/* Current Turn Indicator */}
      {!isVetoComplete && turn && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 border text-center ${
            turn.isMyTurn 
              ? "bg-crimson/20 border-crimson" 
              : "bg-card/50 border-border"
          }`}
        >
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
            {turn.action === "ban" ? "Ban Phase" : turn.action === "pick" ? "Pick Phase" : "Decider Selection"}
          </p>
          <p className="font-heading text-xl text-white">
            {turn.isMyTurn ? (
              <>
                Your turn to{" "}
                <span className={turn.action === "ban" ? "text-crimson" : "text-green-400"}>
                  {turn.action.toUpperCase()}
                </span>{" "}
                a map
              </>
            ) : (
              <>
                <span className="text-crimson">{turn.teamName}</span> is{" "}
                {turn.action === "ban" ? "banning" : "picking"}...
              </>
            )}
          </p>
        </motion.div>
      )}

      {/* Veto Complete */}
      {isVetoComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-green-500/10 border border-green-500/30 text-center"
        >
          <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="font-heading text-xl text-white mb-4">MAP VETO COMPLETE</p>
          <div className="flex justify-center gap-4">
            {pickedMaps.map((mm, idx) => (
              <div key={mm.id} className="bg-card/50 border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Map {idx + 1} {mm.is_decider && "(Decider)"}
                </p>
                <p className="font-heading text-white">{mm.map?.map_name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Side Selection for Picks */}
      {!isVetoComplete && turn?.isMyTurn && (turn.action === "pick" || turn.action === "decider") && (
        <div className="bg-card/50 border border-border p-4">
          <p className="text-sm text-muted-foreground mb-3">Choose your starting side:</p>
          <div className="flex gap-4">
            <Button
              variant={selectedSide === "attack" ? "default" : "outline"}
              onClick={() => setSelectedSide("attack")}
              className={`flex-1 ${selectedSide === "attack" ? "bg-crimson" : ""}`}
            >
              <Crosshair className="w-4 h-4 mr-2" />
              Attack
            </Button>
            <Button
              variant={selectedSide === "defense" ? "default" : "outline"}
              onClick={() => setSelectedSide("defense")}
              className={`flex-1 ${selectedSide === "defense" ? "bg-blue-600" : ""}`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Defense
            </Button>
          </div>
        </div>
      )}

      {/* Available Maps */}
      {!isVetoComplete && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {availableMaps.map((map) => (
              <motion.div
                key={map.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <button
                  onClick={() => handleMapAction(map.id)}
                  disabled={!turn?.isMyTurn || isActing || (turn.action !== "ban" && !selectedSide)}
                  className={`w-full aspect-video relative overflow-hidden group border transition-all ${
                    turn?.isMyTurn && (turn.action === "ban" || selectedSide)
                      ? "border-border hover:border-crimson cursor-pointer"
                      : "border-border/50 cursor-not-allowed opacity-50"
                  }`}
                >
                  {/* Map Image or Placeholder */}
                  {map.map_image_url ? (
                    <img
                      src={map.map_image_url}
                      alt={map.map_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-card to-background" />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Map Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-heading text-white text-lg">{map.map_name}</p>
                  </div>

                  {/* Hover Action */}
                  {turn?.isMyTurn && (
                    <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      turn.action === "ban" ? "bg-crimson/50" : "bg-green-500/50"
                    }`}>
                      {turn.action === "ban" ? (
                        <Ban className="w-12 h-12 text-white" />
                      ) : (
                        <Check className="w-12 h-12 text-white" />
                      )}
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Veto History */}
      {matchMaps.length > 0 && (
        <div className="bg-card/30 border border-border p-4">
          <h4 className="font-heading text-sm text-muted-foreground uppercase mb-3">Veto History</h4>
          <div className="space-y-2">
            {matchMaps.map((mm, idx) => (
              <div key={mm.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground w-6">{idx + 1}.</span>
                {mm.banned_by ? (
                  <>
                    <Ban className="w-4 h-4 text-crimson" />
                    <span className="text-crimson">
                      {mm.banned_by === team1Id ? team1Name : team2Name}
                    </span>
                    <span className="text-muted-foreground">banned</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">
                      {mm.picked_by === team1Id ? team1Name : team2Name}
                    </span>
                    <span className="text-muted-foreground">picked</span>
                  </>
                )}
                <span className="text-white font-medium">{mm.map?.map_name}</span>
                {mm.is_decider && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5">
                    DECIDER
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
