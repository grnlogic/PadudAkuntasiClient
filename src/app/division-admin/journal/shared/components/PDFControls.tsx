import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast-utils";

interface PDFControlsProps {
  onDownloadPDF: () => Promise<void> | void;
  onPreviewPDF: () => Promise<void> | void;
  disabled?: boolean;
  dataCount?: number;
  className?: string;
}

export const PDFControls: React.FC<PDFControlsProps> = ({
  onDownloadPDF,
  onPreviewPDF,
  disabled = false,
  dataCount,
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await onDownloadPDF();
      toastSuccess.custom("PDF berhasil diunduh");
    } catch (error) {
      console.error("PDF download error:", error);
      toastError.custom("Gagal mengunduh PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      await onPreviewPDF();
      toastSuccess.custom("Preview PDF dibuka di tab baru");
    } catch (error) {
      console.error("PDF preview error:", error);
      toastError.custom("Gagal preview PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {dataCount !== undefined && (
        <Badge variant="outline" className="text-sm">
          {dataCount} data tersedia
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handlePreview}
        disabled={disabled || isGenerating}
        className="text-blue-600 hover:text-blue-700"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Preview PDF
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={disabled || isGenerating}
        className="text-green-600 hover:text-green-700"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </>
        )}
      </Button>
    </div>
  );
};
