"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

type BusinessRow = {
  id: string;
  business: string;
  owner: string;
  plan: string;
  status: "Active" | "Suspended";
  mrr: number;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("/api/businesses", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load businesses");
      }

      setBusinesses(data.businesses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBusinesses();
  }, []);

  const toggleStatus = async (row: BusinessRow) => {
    const nextIsActive = row.status !== "Active";

    setUpdatingId(row.id);
    try {
      const res = await fetch("/api/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: row.id, isActive: nextIsActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update status");
      }

      setBusinesses((current) =>
        current.map((b) =>
          b.id === row.id
            ? { ...b, status: nextIsActive ? "Active" : "Suspended" }
            : b,
        ),
      );

      toast.add({
        type: "success",
        title: nextIsActive ? "Business Activated" : "Business Suspended",
        description: `${row.business} is now ${nextIsActive ? "active" : "suspended"}.`,
      });
    } catch (err) {
      toast.add({
        type: "error",
        title: "Update Failed",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <h1 className="text-2xl font-bold tracking-normal">
        Registered Businesses
      </h1>

      {isLoading && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading businesses...
        </p>
      )}

      {error && (
        <div className="my-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => void fetchBusinesses()}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && (
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
                  <TableHead className="w-35" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No businesses registered yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((row) => {
                    const isActive = row.status === "Active";
                    const isUpdating = updatingId === row.id;

                    return (
                      <TableRow key={row.id}>
                        <TableCell className="py-5 font-medium">
                          {row.business}
                        </TableCell>
                        <TableCell>{row.owner}</TableCell>
                        <TableCell>{row.plan}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              isActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/15 text-red-700 dark:text-red-400"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {currency(row.mrr)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isActive ? (
                            <Button
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => toggleStatus(row)}
                              className="border-red-400 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Suspend"
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => toggleStatus(row)}
                              className="border-emerald-400 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Activate"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
