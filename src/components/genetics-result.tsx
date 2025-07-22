
'use client';

import { AviaryAssistantOutput } from "@/ai/flows/assistant-flow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "./ui/badge";

const formatMutationArray = (arr: string[] | undefined) => {
  if (!arr || arr.length === 0) return <span className="text-muted-foreground">None</span>;
  return arr.map(m => <Badge key={m} variant="secondary" className="mr-1 mb-1">{m}</Badge>);
};

export function GeneticsResult({ response }: { response: AviaryAssistantOutput }) {
  const geneticsAction = response.actions?.find(a => a.action === 'geneticsResult');
  if (!geneticsAction || !geneticsAction.data || typeof geneticsAction.data === 'boolean' || !('pairing' in geneticsAction.data) || !('outcomes' in geneticsAction.data)) {
    return <p>{response.response}</p>;
  }

  const { pairing, outcomes } = geneticsAction.data;

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap">{response.response}</p>
      
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Pairing</p>
        <div className="p-3 border rounded-lg text-sm bg-muted/50">
            <p><strong className="capitalize text-blue-400">Male:</strong> {pairing.male}</p>
            <p><strong className="capitalize text-pink-400">Female:</strong> {pairing.female}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Expected Offspring</p>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Chance</TableHead>
                <TableHead className="w-[15%]">Sex</TableHead>
                <TableHead>Visual</TableHead>
                <TableHead>Split</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outcomes.map((outcome, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{outcome.percentage}%</TableCell>
                  <TableCell className="capitalize">{outcome.sex}</TableCell>
                  <TableCell>{formatMutationArray(outcome.visuals)}</TableCell>
                  <TableCell>{formatMutationArray(outcome.splits)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
