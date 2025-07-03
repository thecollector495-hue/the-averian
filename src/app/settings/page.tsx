import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-base">
              Dark Mode
            </Label>
            <Switch id="dark-mode" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-base">
              Enable Notifications
            </Label>
            <Switch id="notifications" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
