import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { usePageSetting } from "@/hooks/usePageSettings";

export interface PageBannerProps {
  pageKey: string;
  defaultBadge?: string;
  defaultTitle: string;
  defaultSubtitle?: string;
  defaultImage?: string;
  defaultPrimaryLabel?: string;
  defaultPrimaryUrl?: string;
  defaultSecondaryLabel?: string;
  defaultSecondaryUrl?: string;
  highlight?: string; // word to color with japanese accent
}

const PageBanner = ({
  pageKey,
  defaultBadge,
  defaultTitle,
  defaultSubtitle,
  defaultImage,
  defaultPrimaryLabel,
  defaultPrimaryUrl,
  defaultSecondaryLabel,
  defaultSecondaryUrl,
  highlight,
}: PageBannerProps) => {
  const { data: page } = usePageSetting(pageKey);

  const badge = page?.hero_badge_vi || defaultBadge;
  const title = page?.hero_title_vi || defaultTitle;
  const subtitle = page?.hero_subtitle_vi || defaultSubtitle;
  const image = page?.hero_image_url || defaultImage;
  const overlay = Math.max(0, Math.min(100, Number(page?.hero_overlay ?? 50))) / 100;
  const primaryLabel = page?.hero_cta_primary_label || defaultPrimaryLabel;
  const primaryUrl = page?.hero_cta_primary_url || defaultPrimaryUrl;
  const secondaryLabel = page?.hero_cta_secondary_label || defaultSecondaryLabel;
  const secondaryUrl = page?.hero_cta_secondary_url || defaultSecondaryUrl;

  const renderTitle = () => {
    if (highlight && title.includes(highlight)) {
      const [a, b] = title.split(highlight);
      return (
        <>
          {a}
          <span className="text-japanese">{highlight}</span>
          {b}
        </>
      );
    }
    return title;
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-background" style={{ opacity: overlay }} />
        </>
      )}
      {!image && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-japanese/5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-japanese/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-japanese/10 text-japanese text-sm font-semibold mb-6 border border-japanese/20">
              <Sparkles className="w-4 h-4" /> {badge}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight">
            {renderTitle()}
          </h1>
          {subtitle && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{subtitle}</p>
          )}
          {(primaryLabel || secondaryLabel) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryLabel && (
                <Button variant="hero" size="xl" asChild>
                  <Link to={primaryUrl || "#"}>{primaryLabel}</Link>
                </Button>
              )}
              {secondaryLabel && (
                <Button variant="outline" size="xl" asChild>
                  <Link to={secondaryUrl || "#"}>{secondaryLabel}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageBanner;