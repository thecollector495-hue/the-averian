
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency, currencies } from "@/context/CurrencyContext";

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();

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
          <div className="flex items-center justify-between">
            <Label htmlFor="currency-select" className="text-base">
              Currency
            </Label>
             <Select value={currency.code} onValueChange={setCurrency}>
              <SelectTrigger id="currency-select" className="w-[200px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
