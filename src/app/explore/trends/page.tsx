import { TrendsClient } from "./trends-client";

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trends Over Time</h1>
        <p className="text-muted-foreground mt-1">
          Track how insurance indexes have changed across model years
        </p>
      </div>
      <TrendsClient />
    </div>
  );
}