"use client";

import { useState } from "react";
import { useSettings } from "@/lib/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const {
    settings,
    loading,
    error,
    updateSetting,
    resetSetting,
    exportSettings,
    refresh,
  } = useSettings();
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Group settings by category
  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, typeof settings>);

  // Handle input change
  const handleChange = (key: string, value: any, type: string) => {
    let parsedValue = value;

    if (type === "number") {
      parsedValue = parseFloat(value) || 0;
    } else if (type === "boolean") {
      parsedValue = value === "true";
    }

    setEditedValues((prev) => ({
      ...prev,
      [key]: parsedValue,
    }));
  };

  // Save single setting
  const handleSave = async (key: string) => {
    try {
      setSaving((prev) => ({ ...prev, [key]: true }));

      const value = editedValues[key];
      await updateSetting(key, value);

      // Clear edited value
      setEditedValues((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });

      toast.success(`Setting "${key}" berhasil diupdate`);
    } catch (err: any) {
      toast.error(err.message || "Gagal update setting");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Reset single setting
  const handleReset = async (key: string) => {
    if (!confirm(`Reset "${key}" ke nilai default?`)) return;

    try {
      setSaving((prev) => ({ ...prev, [key]: true }));
      await resetSetting(key);

      // Clear edited value
      setEditedValues((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });

      toast.success(`Setting "${key}" berhasil direset`);
    } catch (err: any) {
      toast.error(err.message || "Gagal reset setting");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Export all settings
  const handleExport = async () => {
    try {
      const data = await exportSettings();

      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Settings berhasil diexport");
    } catch (err: any) {
      toast.error(err.message || "Gagal export settings");
    }
  };

  // Render input based on type
  const renderInput = (setting: (typeof settings)[0]) => {
    const key = setting.setting_key;
    const currentValue =
      editedValues[key] !== undefined
        ? editedValues[key]
        : setting.setting_value;
    const isEdited = editedValues[key] !== undefined;
    const isSaving = saving[key];

    if (setting.setting_type === "boolean") {
      return (
        <div className="flex items-center gap-4">
          <select
            value={String(currentValue)}
            onChange={(e) =>
              handleChange(key, e.target.value, setting.setting_type)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="true">True (Aktif)</option>
            <option value="false">False (Nonaktif)</option>
          </select>
          {currentValue ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      );
    }

    return (
      <Input
        type={setting.setting_type === "number" ? "number" : "text"}
        value={currentValue}
        onChange={(e) =>
          handleChange(key, e.target.value, setting.setting_type)
        }
        className={isEdited ? "border-yellow-500 focus:border-yellow-600" : ""}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Kelola pengaturan sistem aplikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Settings
          </Button>
        </div>
      </div>

      {/* Settings by Category */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">
              {category.replace("_", " ")} Settings
            </CardTitle>
            <CardDescription>
              {category === "general" && "Pengaturan umum aplikasi"}
              {category === "security" && "Pengaturan keamanan dan autentikasi"}
              {category === "ui" && "Pengaturan tampilan antarmuka"}
              {category === "notification" && "Pengaturan notifikasi"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categorySettings.map((setting) => {
              const isEdited = editedValues[setting.setting_key] !== undefined;
              const isSaving = saving[setting.setting_key];

              return (
                <div
                  key={setting.id}
                  className="space-y-2 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={setting.setting_key}
                          className="font-medium"
                        >
                          {setting.setting_key}
                        </Label>
                        <Badge
                          variant={setting.is_public ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {setting.is_public ? "Public" : "Private"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {setting.setting_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">{renderInput(setting)}</div>
                    <Button
                      size="sm"
                      onClick={() => handleSave(setting.setting_key)}
                      disabled={!isEdited || isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReset(setting.setting_key)}
                      disabled={isSaving}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(setting.updated_at).toLocaleString("id-ID")}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
