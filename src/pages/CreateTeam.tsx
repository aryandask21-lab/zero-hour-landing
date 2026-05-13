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
import { ArrowLeft, Shield, Target } from "lucide-react";
import { z } from "zod";

const teamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  tag: z.string().max(6, "Tag must be 6 characters or less").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  max_members: z.number().min(2).max(10)
});

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    description: "",
    max_members: 5
  });
  const [memberCallsigns, setMemberCallsigns] = useState("");

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validation = teamSchema.safeParse({
        ...formData,
        tag: formData.tag || undefined,
        description: formData.description || undefined
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
        .from("teams")
        .insert({
          owner_id: user.id,
          name: formData.name,
          tag: formData.tag || null,
          description: formData.description || null,
          max_members: formData.max_members
        })
        .select()
        .single();

      if (error) throw error;

      // Add members by callsign (username)
      const callsigns = memberCallsigns
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);

      let addedCount = 0;
      const notFound: string[] = [];
      if (callsigns.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("username", callsigns);

        const found = new Map((profiles || []).map(p => [p.username.toLowerCase(), p.id]));

        const inserts: { team_id: string; user_id: string; invited_by: string; role: string }[] = [];
        for (const cs of callsigns) {
          const uid = found.get(cs.toLowerCase());
          if (!uid) { notFound.push(cs); continue; }
          if (uid === user.id) continue; // owner already added by trigger
          inserts.push({ team_id: data.id, user_id: uid, invited_by: user.id, role: "member" });
        }
        if (inserts.length > 0) {
          const { error: memErr } = await supabase.from("team_members").insert(inserts);
          if (!memErr) addedCount = inserts.length;
        }
      }

      toast({
        title: "Team created",
        description: `Team ready${addedCount ? `, ${addedCount} member(s) added` : ""}${notFound.length ? `. Not found: ${notFound.join(", ")}` : ""}`
      });

      navigate(`/teams/${data.id}`);
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
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
        <div className="container mx-auto px-6 max-w-xl">
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
                <Shield className="w-8 h-8 text-crimson" />
              </div>
              <h1 className="font-heading text-4xl text-white mb-2">
                CREATE TEAM
              </h1>
              <p className="text-muted-foreground">
                Assemble your tactical squad
              </p>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card/50 border border-border p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Shadow Operatives"
                    className="bg-background border-border focus:border-crimson"
                  />
                  {errors.name && <p className="text-sm text-crimson">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag">Team Tag</Label>
                  <Input
                    id="tag"
                    value={formData.tag}
                    onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                    placeholder="SHAD"
                    maxLength={6}
                    className="bg-background border-border focus:border-crimson uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Short identifier for your team (max 6 chars)</p>
                  {errors.tag && <p className="text-sm text-crimson">{errors.tag}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell others about your team..."
                    className="bg-background border-border focus:border-crimson min-h-[100px]"
                  />
                  {errors.description && <p className="text-sm text-crimson">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_members">Max Team Size</Label>
                  <Select
                    value={formData.max_members.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, max_members: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 members</SelectItem>
                      <SelectItem value="3">3 members</SelectItem>
                      <SelectItem value="4">4 members</SelectItem>
                      <SelectItem value="5">5 members</SelectItem>
                      <SelectItem value="6">6 members</SelectItem>
                      <SelectItem value="8">8 members</SelectItem>
                      <SelectItem value="10">10 members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="members">Add Members (Callsigns)</Label>
                  <Textarea
                    id="members"
                    value={memberCallsigns}
                    onChange={(e) => setMemberCallsigns(e.target.value)}
                    placeholder="ghost_07, viper_22, reaper"
                    className="bg-background border-border focus:border-crimson min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">Comma or newline separated. Use existing player callsigns. You're added automatically as leader.</p>
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
                  {isLoading ? "CREATING..." : "CREATE TEAM"}
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
