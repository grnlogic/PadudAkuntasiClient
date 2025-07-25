import React, { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { publicAbsensiAPI } from "@/lib/api";

interface PublicAbsensiFormProps {
  users: Array<{
    namaLengkap: string | undefined;
    id: number;
    nama?: string;
    username?: string;
  }>;
}

const statusOptions = ["HADIR", "SAKIT", "IZIN", "ALPA"];

export default function PublicAbsensiForm({ users }: PublicAbsensiFormProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("");
  const [hadir, setHadir] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !status) {
      setResult("Pilih karyawan dan status terlebih dahulu.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await publicAbsensiAPI.updateStatus(
        Number(selectedUserId),
        hadir,
        status
      );
      if (!res.success) {
        setResult(res.error || "Gagal menyimpan absensi.");
      } else {
        setResult("Absensi berhasil disimpan!");
      }
    } catch (err: any) {
      setResult("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Pilih Karyawan</Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih karyawan..." />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id.toString()}>
                {u.namaLengkap || u.username || `ID ${u.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status..." />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hadir}
          onChange={() => setHadir((v) => !v)}
          id="hadir-checkbox"
        />
        <label htmlFor="hadir-checkbox">Hadir</label>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {loading ? "Menyimpan..." : "Simpan Absensi Publik"}
      </Button>
      {result && <div className="mt-2 text-sm text-blue-700">{result}</div>}
    </form>
  );
}
