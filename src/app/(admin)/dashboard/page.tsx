
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email || 'Admin'}!</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>High-level application metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is where dashboard widgets will go.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage application users.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>User list and management tools will be here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure global settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>System-wide configuration options.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
