import { FileText, ExternalLink } from 'lucide-react';

interface Props { url: string; name?: string }

const InlineViewer = ({ url, name }: Props) => {
  if (!url) return null;
  const lower = url.toLowerCase();
  const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(lower);
  const isPdf = /\.pdf(\?|$)/.test(lower);
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/.test(lower);
  const isAudio = /\.(mp3|wav|m4a|ogg)(\?|$)/.test(lower);
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  const isOffice = /\.(docx?|pptx?|xlsx?)(\?|$)/.test(lower);

  if (ytMatch) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden border bg-black">
        <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (isImg) return <img src={url} alt={name || ''} className="rounded-xl border max-h-[75vh] mx-auto" />;
  if (isVideo) return <video controls src={url} className="rounded-xl border w-full max-h-[75vh] bg-black" />;
  if (isAudio) return <audio controls src={url} className="w-full" />;
  if (isPdf) return <iframe src={url} className="w-full h-[75vh] rounded-xl border" title={name || 'PDF'} />;
  if (isOffice) {
    const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return <iframe src={src} className="w-full h-[75vh] rounded-xl border" title={name || 'Document'} />;
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-4 border rounded-xl hover:bg-muted/50">
      <FileText className="w-5 h-5 text-primary" />
      <span className="flex-1 truncate">{name || url}</span>
      <ExternalLink className="w-4 h-4" />
    </a>
  );
};

export default InlineViewer;