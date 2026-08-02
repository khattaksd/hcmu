"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUp, ChevronDown } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SWR_OPTS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  dedupingInterval: 2000,
};

interface Filters {
  makes: string[];
  bodyStyles: string[];
  powerTypes: string[];
  yearRange: { min: number; max: number };
}

interface RateRow {
  collision: number | null;
  comp: number | null;
  dcpd: number | null;
  ab: number | null;
  make: string;
  model: string;
  body_style: string | null;
  model_year: number;
  power_type: string | null;
  theft_frequency: number | null;
}

interface RatesResponse {
  data: RateRow[];
  total: number;
  page: number;
  limit: number;
}

const COLS = [
  { key: "make", label: "Make", desc: "Vehicle manufacturer" },
  { key: "model", label: "Model", desc: "Vehicle model name and trim" },
  { key: "model_year", label: "Year", desc: "Model year" },
  { key: "body_style", label: "Body", desc: "Body style (2D, 4D, SUV, PU, VAN, WGN)" },
  { key: "power_type", label: "Power", desc: "Fuel or power type" },
  { key: "collision", label: "Collision", desc: "Collision insurance claim cost index" },
  { key: "comp", label: "Comp", desc: "Comprehensive insurance claim cost index" },
  { key: "dcpd", label: "DCPD", desc: "Direct Compensation Property Damage claim cost index" },
  { key: "ab", label: "AB", desc: "Accident Benefits personal injury claim cost index" },
  { key: "theft_frequency", label: "Theft", desc: "Theft-related claim frequency index" },
];

export function BrowseClient({ filters }: { filters: Filters }) {
  const [make, setMake] = useState("");
  const [bodyStyle, setBodyStyle] = useState("");
  const [powerType, setPowerType] = useState("");
  const [sortBy, setSortBy] = useState("model_year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Build the query URL — SWR caches responses keyed by URL
  const params = new URLSearchParams();
  if (make) params.set("make", make);
  if (bodyStyle) params.set("body_style", bodyStyle);
  if (powerType) params.set("power_type", powerType);
  params.set("sort_by", sortBy);
  params.set("sort_dir", sortDir);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, isLoading } = useSWR<RatesResponse>(
    `/api/rates?${params}`,
    fetcher,
    SWR_OPTS
  );

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-full sm:w-auto">
        <Select value={make} onValueChange={(v) => { setMake(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Makes</SelectItem>
            {filters.makes.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>

        <div className="w-full sm:w-auto">
        <Select value={bodyStyle} onValueChange={(v) => { setBodyStyle(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Body Styles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Styles</SelectItem>
            {filters.bodyStyles.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>

        <div className="w-full sm:w-auto">
        <Select value={powerType} onValueChange={(v) => { setPowerType(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Power Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Power Types</SelectItem>
            {filters.powerTypes.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLS.map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none"
                  title={col.desc}
                  onClick={() => toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key &&
                      (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{row.make}</TableCell>
                  <TableCell>{row.model}</TableCell>
                  <TableCell>{row.model_year}</TableCell>
                  <TableCell>{row.body_style ?? "—"}</TableCell>
                  <TableCell className="text-xs">{row.power_type?.replace("Gasoline/Diesel", "Gas") ?? "—"}</TableCell>
                  <TableCell title="Collision index">{row.collision ?? "—"}</TableCell>
                  <TableCell title="Comp index">{row.comp ?? "—"}</TableCell>
                  <TableCell title="DCPD — Direct Compensation Property Damage index">{row.dcpd ?? "—"}</TableCell>
                  <TableCell title="AB — Accident Benefits index">{row.ab ?? "—"}</TableCell>
                  <TableCell title="Theft frequency index">{row.theft_frequency ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {data
            ? `${Math.min((page - 1) * limit + 1, total)}–${Math.min(page * limit, total)} of ${total}`
            : "—"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}