import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  url: string;
  title?: string;
  fileType?: string;
}

const getType = (url: string, fileType?: string) => {
  const ext = (fileType || url.split(".").pop() || "").toLowerCase();
  if (ext.includes("pdf")) return "pdf";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) return "office";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
};

const DocumentViewer = ({ url, title, fileType }: DocumentViewerProps) => {
  const type = getType(url, fileType);
  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium truncate">{title || "Tài liệu"}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Mở tab mới
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={url} download>
              <Download className="w-3.5 h-3.5 mr-1" /> Tải về
            </a>
          </Button>
        </div>
      </div>

      <div className="w-full aspect-[4/3] md:aspect-[16/10] rounded-xl border bg-muted overflow-hidden">
        {type === "pdf" && (
          <iframe src={url} title={title || "PDF"} className="w-full h-full" />
        )}
        {type === "office" && (
          <iframe src={officeSrc} title={title || "Office"} className="w-full h-full" />
        )}
        {type === "video" && (
          <video src={url} controls className="w-full h-full bg-black" />
        )}
        {type === "image" && (
          <img src={url} alt={title || "image"} className="w-full h-full object-contain" />
        )}
        {type === "other" && (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <FileText className="w-12 h-12 opacity-40" />
            <p>Không xem trước được, hãy tải về để mở.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;