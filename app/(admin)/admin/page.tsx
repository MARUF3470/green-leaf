// app/(admin)/admin/businesses/page.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const businesses = [
  {
    business: "GreenLeaf Services",
    owner: "Marcus Johnson",
    plan: "Growth",
    status: "Active",
    mrr: "$79",
  },
  {
    business: "Sparkle Clean Co.",
    owner: "Aisha Kamara",
    plan: "Pro",
    status: "Active",
    mrr: "$149",
  },
  {
    business: "QuickFix Repairs",
    owner: "Tom Bauer",
    plan: "Starter",
    status: "Active",
    mrr: "$29",
  },
  {
    business: "Urban Lawn Ltd.",
    owner: "Nadia Rossi",
    plan: "Growth",
    status: "Suspended",
    mrr: "$79",
  },
];

export default function AdminBusinessesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <h1 className="text-2xl font-bold tracking-normal">
        Registered Businesses
      </h1>

      <Card className="mt-7 overflow-hidden p-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {businesses.map((business) => {
                const isActive = business.status === "Active";

                return (
                  <TableRow key={business.business}>
                    <TableCell className="py-5 font-medium">
                      {business.business}
                    </TableCell>
                    <TableCell>{business.owner}</TableCell>
                    <TableCell>{business.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          isActive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                        }
                      >
                        {business.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">{business.mrr}</TableCell>
                    <TableCell className="text-right">
                      {isActive ? (
                        <Button
                          variant="outline"
                          className="border-red-400 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="border-emerald-400 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
