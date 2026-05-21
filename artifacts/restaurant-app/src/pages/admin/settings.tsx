import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useRestaurantConfig, useUpdateRestaurantConfig } from "@/lib/api-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Settings, Save, Loader2, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminSettings() {
  const { data: config, isLoading } = useRestaurantConfig();
  const updateConfigMutation = useUpdateRestaurantConfig();

  const [formData, setFormData] = useState({
    name: "",
    packing_charge: 0,
    gst_percentage: 0,
    opening_time: "09:00",
    closing_time: "22:00",
    weekday_timing: {} as Record<string, { open: string; close: string }>,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        packing_charge: config.packing_charge,
        gst_percentage: config.gst_percentage,
        opening_time: (config as any).opening_time?.substring(0, 5) || "09:00",
        closing_time: (config as any).closing_time?.substring(0, 5) || "22:00",
        weekday_timing: config.weekday_timing || {},
      });
    }
  }, [config]);

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const newTiming = { ...prev.weekday_timing };
      if (newTiming[day]) {
        delete newTiming[day];
      } else {
        newTiming[day] = { open: prev.opening_time, close: prev.closing_time };
      }
      return { ...prev, weekday_timing: newTiming };
    });
  };

  const handleDayTimeChange = (day: string, field: "open" | "close", value: string) => {
    setFormData(prev => ({
      ...prev,
      weekday_timing: {
        ...prev.weekday_timing,
        [day]: { ...prev.weekday_timing[day], [field]: value }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfigMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.success("Settings updated successfully");
        },
        onError: () => {
          toast.error("Failed to update settings");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="page-container py-5 sm:py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container py-5 sm:py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
          <h1 className="page-title">Restaurant Settings</h1>
        </div>
        <Link to="/admin/dashboard">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <Card className="border-card-border rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Basic restaurant details and charges.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packing">Packing Charge (₹)</Label>
                  <Input 
                    id="packing" 
                    type="number" 
                    value={formData.packing_charge} 
                    onChange={e => setFormData(prev => ({ ...prev, packing_charge: Number(e.target.value) }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gst">GST (%)</Label>
                  <Input 
                    id="gst" 
                    type="number" 
                    step="0.1"
                    value={formData.gst_percentage} 
                    onChange={e => setFormData(prev => ({ ...prev, gst_percentage: Number(e.target.value) }))} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Timing */}
        <Card className="border-card-border rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Default Operating Hours
            </CardTitle>
            <CardDescription>Standard opening and closing times for all days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="open">Opening Time</Label>
                <Input 
                  id="open" 
                  type="time" 
                  value={formData.opening_time} 
                  onChange={e => setFormData(prev => ({ ...prev, opening_time: e.target.value }))} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close">Closing Time</Label>
                <Input 
                  id="close" 
                  type="time" 
                  value={formData.closing_time} 
                  onChange={e => setFormData(prev => ({ ...prev, closing_time: e.target.value }))} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekday Customization */}
        <Card className="border-card-border rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Weekday Custom Timings
            </CardTitle>
            <CardDescription>Override default hours for specific days of the week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Select a day to enable custom timings. Unselected days will use the default hours above.
            </p>
            
            <div className="space-y-4">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <Button
                      type="button"
                      variant={formData.weekday_timing[day] ? "default" : "outline"}
                      size="sm"
                      className="w-16"
                      onClick={() => handleDayToggle(day)}
                    >
                      {day}
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">
                      {formData.weekday_timing[day] ? "Custom" : "Default"}
                    </span>
                  </div>

                  {formData.weekday_timing[day] && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                      <Input 
                        type="time" 
                        className="w-32 h-9"
                        value={formData.weekday_timing[day].open}
                        onChange={e => handleDayTimeChange(day, "open", e.target.value)}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input 
                        type="time" 
                        className="w-32 h-9"
                        value={formData.weekday_timing[day].close}
                        onChange={e => handleDayTimeChange(day, "close", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] h-12 font-bold shadow-lg"
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 w-5 h-5" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
