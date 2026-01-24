import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trophy, Target } from "lucide-react";
import { z } from "zod";

const tournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  game_mode: z.string(),
  team_size: z.number().min(1).max(10),
  max_teams: z.number().min(2).max(128).optional(),
  prize_pool: z.string().max(100).optional(),
  rules: z.string().max(5000).optional(),
  bracket_type: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss"]),
  start_time: z.string().optional(),
  registration_deadline: z.string().optional(),
  livestream_url: z.string().url().optional().or(z.literal(""))
});

export default function CreateTournament() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    game_mode: "Bomb Defusal",
    team_size: 5,
    max_teams: 16,
    prize_pool: "",
    rules: "",
    bracket_type: "single_elimination" as "single_elimination" | "double_elimination" | "round_robin" | "swiss",
    start_time: "",
    registration_deadline: "",
    livestream_url: ""
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validation = tournamentSchema.safeParse({
        ...formData,
        max_teams: formData.max_teams || undefined,
        prize_pool: formData.prize_pool || undefined,
        rules: formData.rules || undefined,
        start_time: formData.start_time || undefined,
        registration_deadline: formData.registration_deadline || undefined,
        livestream_url: formData.livestream_url || undefined
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          creator_id: user.id,
          name: formData.name,
          description: formData.description || null,
          game_mode: formData.game_mode,
          team_size: formData.team_size,
          max_teams: formData.max_teams || null,
          prize_pool: formData.prize_pool || null,
          rules: formData.rules || null,
          bracket_type: formData.bracket_type,
          start_time: formData.start_time || null,
          registration_deadline: formData.registration_deadline || null,
          livestream_url: formData.livestream_url || null,
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Tournament created",
        description: "Your tournament has been created successfully"
      });

      navigate(`/tournaments/${data.id}/manage`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>

          {/* Header */}
          <ScrollReveal>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-crimson/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-crimson" />
              </div>
              <h1 className="font-heading text-4xl text-white mb-2">
                CREATE TOURNAMENT
              </h1>
              <p className="text-muted-foreground">
                Set up your tactical esports event
              </p>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <h3 className="font-heading text-lg text-white border-b border-border pb-2 mb-4">
                  BASIC INFORMATION
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Zero Hour Championship Series"
                    className="bg-background border-border focus:border-crimson"
                  />
                  {errors.name && <p className="text-sm text-crimson">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your tournament..."
                    className="bg-background border-border focus:border-crimson min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="game_mode">Game Mode</Label>
                    <Select
                      value={formData.game_mode}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, game_mode: value }))}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bomb Defusal">Bomb Defusal</SelectItem>
                        <SelectItem value="Hostage Rescue">Hostage Rescue</SelectItem>
                        <SelectItem value="Co-op">Co-op</SelectItem>
                        <SelectItem value="Mixed">Mixed Modes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bracket_type">Bracket Type</Label>
                    <Select
                      value={formData.bracket_type}
                      onValueChange={(value: "single_elimination" | "double_elimination" | "round_robin" | "swiss") => 
                        setFormData(prev => ({ ...prev, bracket_type: value }))
                      }
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_elimination">Single Elimination</SelectItem>
                        <SelectItem value="double_elimination">Double Elimination</SelectItem>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="swiss">Swiss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Team Settings */}
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <h3 className="font-heading text-lg text-white border-b border-border pb-2 mb-4">
                  TEAM SETTINGS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size *</Label>
                    <Select
                      value={formData.team_size.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, team_size: parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1v1</SelectItem>
                        <SelectItem value="2">2v2</SelectItem>
                        <SelectItem value="3">3v3</SelectItem>
                        <SelectItem value="4">4v4</SelectItem>
                        <SelectItem value="5">5v5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_teams">Max Teams</Label>
                    <Input
                      id="max_teams"
                      type="number"
                      min="2"
                      max="128"
                      value={formData.max_teams}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_teams: parseInt(e.target.value) || 16 }))}
                      className="bg-background border-border focus:border-crimson"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <h3 className="font-heading text-lg text-white border-b border-border pb-2 mb-4">
                  SCHEDULE
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Date & Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="bg-background border-border focus:border-crimson"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registration_deadline">Registration Deadline</Label>
                    <Input
                      id="registration_deadline"
                      type="datetime-local"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                      className="bg-background border-border focus:border-crimson"
                    />
                  </div>
                </div>
              </div>

              {/* Prize & Rules */}
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <h3 className="font-heading text-lg text-white border-b border-border pb-2 mb-4">
                  PRIZES & RULES
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="prize_pool">Prize Pool</Label>
                  <Input
                    id="prize_pool"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData(prev => ({ ...prev, prize_pool: e.target.value }))}
                    placeholder="$500 | Gaming peripherals | In-game items"
                    className="bg-background border-border focus:border-crimson"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Rules</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                    placeholder="Tournament rules and regulations..."
                    className="bg-background border-border focus:border-crimson min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="livestream_url">Livestream URL</Label>
                  <Input
                    id="livestream_url"
                    value={formData.livestream_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, livestream_url: e.target.value }))}
                    placeholder="https://twitch.tv/yourstream"
                    className="bg-background border-border focus:border-crimson"
                  />
                  {errors.livestream_url && <p className="text-sm text-crimson">{errors.livestream_url}</p>}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 btn-outline-tactical"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary-tactical"
                >
                  {isLoading ? "CREATING..." : "CREATE TOURNAMENT"}
                </Button>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}
