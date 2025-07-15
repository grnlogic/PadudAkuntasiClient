"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Users, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getEntriHarianByDate } from "@/lib/data";
import { getDivisions } from "@/lib/divisions";
import { getAccounts } from "@/lib/data";

export default function MonitoringHRDPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getEntriHarianByDate(date), getDivisions(), getAccounts()])
      .then(([entries, divs, accs]) => {
        // Filter hanya entri HRD (yang punya attendanceStatus)
        const hrdEntries = entries.filter((e) => e.attendanceStatus);
        setAttendance(hrdEntries);
        setDivisions(divs);
        setAccounts(accs);
      })
      .finally(() => setLoading(false));
  }, [date]);

  // Hitung summary
  const summary = attendance.reduce(
    (acc, entry) => {
      const count = Number(entry.absentCount) || 0;
      acc.total += count;
      if (entry.attendanceStatus === "HADIR") acc.hadir += count;
      else acc.tidakHadir += count;
      return acc;
    },
    { total: 0, hadir: 0, tidakHadir: 0 }
  );
  const attendanceRate =
    summary.total > 0 ? (summary.hadir / summary.total) * 100 : 0;

  // Group by division (optional, if you want per-division summary)
  const attendanceByDivision = divisions
    .filter((d) => d.name.toLowerCase().includes("hrd"))
    .map((div) => {
      const entries = attendance.filter(
        (e) => e.divisionName === div.name || e.division?.name === div.name
      );
      const total = entries.reduce(
        (sum, e) => sum + (Number(e.absentCount) || 0),
        0
      );
      const hadir = entries
        .filter((e) => e.attendanceStatus === "HADIR")
        .reduce((sum, e) => sum + (Number(e.absentCount) || 0), 0);
      const tidakHadir = total - hadir;
      const rate = total > 0 ? (hadir / total) * 100 : 0;
      return { division: div.name, total, hadir, tidakHadir, rate };
    });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6" /> Monitoring Absensi HRD
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Kehadiran Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div>
              <div className="text-gray-600">Tanggal</div>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div>
              <div className="text-gray-600">Total Karyawan</div>
              <div className="text-2xl font-bold">{summary.total}</div>
            </div>
            <div>
              <div className="text-green-600">Hadir</div>
              <div className="text-2xl font-bold">{summary.hadir}</div>
            </div>
            <div>
              <div className="text-red-600">Tidak Hadir</div>
              <div className="text-2xl font-bold">{summary.tidakHadir}</div>
            </div>
            <div>
              <div className="text-blue-600">Persentase Hadir</div>
              <div className="text-2xl font-bold">
                {attendanceRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {attendanceByDivision.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekap Per Divisi HRD</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Hadir</TableHead>
                  <TableHead>Tidak Hadir</TableHead>
                  <TableHead>Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceByDivision.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.division}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.hadir}</TableCell>
                    <TableCell>{row.tidakHadir}</TableCell>
                    <TableCell>{row.rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Detail Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Akun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((entry, idx) => {
                const account = accounts.find(
                  (acc) => acc.id === entry.accountId
                );
                return (
                  <TableRow key={idx}>
                    <TableCell>{account?.accountName || "-"}</TableCell>
                    <TableCell>
                      <Badge>{entry.attendanceStatus}</Badge>
                    </TableCell>
                    <TableCell>{entry.absentCount}</TableCell>
                    <TableCell>{entry.shift}</TableCell>
                    <TableCell>
                      {entry.keteranganKendala || entry.keterangan || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
