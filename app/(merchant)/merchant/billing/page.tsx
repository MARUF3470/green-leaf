// app/(merchant)/merchant/billing/page.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const plans = [
  {
    name: "Starter",
    price: "$29",
    current: false,
    features: ["20 tasks/month", "3 employees", "Analytics & reporting"],
    action: "Downgrade",
  },
  {
    name: "Growth",
    price: "$79",
    current: true,
    features: ["100 tasks/month", "15 employees", "Analytics & reporting"],
    action: null,
  },
  {
    name: "Pro",
    price: "$149",
    current: false,
    features: [
      "Unlimited tasks/month",
      "Unlimited employees",
      "Analytics & reporting",
    ],
    action: "Upgrade",
  },
];

const invoices = [
  {
    invoice: "INV-2026-08",
    date: "Aug 1, 2026",
    status: "Paid",
    amount: "$79.00",
  },
  {
    invoice: "INV-2026-07",
    date: "Jul 1, 2026",
    status: "Paid",
    amount: "$79.00",
  },
  {
    invoice: "INV-2026-06",
    date: "Jun 1, 2026",
    status: "Paid",
    amount: "$79.00",
  },
];

export default function MerchantBillingPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-normal">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan, payment method, and invoices
        </p>
      </div>

      <section className="mt-8 rounded-2xl bg-blue-600 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-white/80">Current Plan</p>
            <h2 className="mt-2 text-2xl font-bold">Growth Plan</h2>
            <p className="mt-2 text-sm text-white/80">
              Up to 100 tasks/mo · 15 employees · Next billing Sep 1, 2026
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-3xl font-bold">$79</p>
            <p className="text-sm text-white/80">per month</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.current
                ? "border-blue-500 bg-blue-500/5 shadow-sm"
                : "shadow-sm"
            }
          >
            <CardContent className="p-6">
              {plan.current ? (
                <Badge className="mb-3 bg-blue-600 text-white hover:bg-blue-600">
                  Current
                </Badge>
              ) : null}

              <h3 className="text-lg font-bold">{plan.name}</h3>

              <div className="mt-3 flex items-end gap-1">
                <p className="text-3xl font-bold">{plan.price}</p>
                <p className="pb-1 text-sm text-muted-foreground">/mo</p>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>

              {plan.action ? (
                <Button variant="outline" className="mt-6 w-full">
                  {plan.action}
                </Button>
              ) : (
                <div className="mt-6 h-10" />
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-4">
              <div className="grid h-8 w-12 place-items-center rounded bg-blue-600 text-xs font-bold text-white">
                VISA
              </div>

              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expires 09/28
                </p>
              </div>
            </div>

            <Button
              variant="link"
              className="px-0 text-blue-600 dark:text-blue-400"
            >
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoice}>
                  <TableCell className="font-medium">
                    {invoice.invoice}
                  </TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {invoice.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
