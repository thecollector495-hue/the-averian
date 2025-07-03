import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TransactionsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your transactions will be listed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
