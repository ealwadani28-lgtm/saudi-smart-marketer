import { Link } from "@tanstack/react-router";

const LOGO_URL =
  "https://justlator.com/__l5e/assets-v1/ba8c8d6c-29a5-4b43-9b01-8ae6a0ddd2a0/justlator-emblem.png";

type ProductStatus = "live" | "soon";
type Product = { name: string; sub?: string; href?: string; status: ProductStatus };

const PRODUCTS: Product[] = [
  { name: "JustMarketing", sub: "المسوّق الذكي", status: "live", href: "https://justmarketing.justlator.com" },
  { name: "Justlator Tools", status: "live", href: "https://www.justlator.com" },
  { name: "JustSecure", sub: "حصين", status: "soon" },
  { name: "JustSyncFlow", status: "soon" },
];

const LINKS = [
  { label: "جميع الأدوات", href: "https://www.justlator.com" },
  { label: "من نحن", href: "https://www.justlator.tech" },
  { label: "تواصل معنا", href: "mailto:hello@justlator.tech" },
  { label: "سياسة الخصوصية", to: "/privacy" as const },
  { label: "الشروط والأحكام", to: "/terms" as const },
];

export function JustlatorFooter() {
  return (
    <footer
      dir="rtl"
      className="relative border-t border-border bg-gradient-to-b from-background to-muted/40"
    >
      {/* Signature block */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <img
          src={LOGO_URL}
          alt="Justlator Technologies"
          className="mx-auto h-16 w-auto"
          loading="lazy"
        />

        <h2
          className="mt-5 font-display text-3xl font-bold tracking-[0.3em] text-foreground md:text-4xl"
          style={{ letterSpacing: "0.28em" }}
        >
          JUSTLATOR
        </h2>
        <div className="mt-2 text-xs font-semibold tracking-[0.4em] text-primary">
          TECHNOLOGIES
        </div>

        <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-[10px] font-medium tracking-[0.4em] text-muted-foreground">
          <span className="h-px w-10 bg-border" />
          SIGNATURE
          <span className="h-px w-10 bg-border" />
        </div>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          شركة <span className="font-bold text-primary">مبدأ العدالة للتقنية</span> — نبني منتجات
          رقمية بمبادئ العدل والإنصاف
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80">
          A <span className="font-semibold text-foreground">Justlator Technologies</span> product family
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px w-full bg-border" />
      </div>

      {/* Products + Links */}
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2">
        {/* منتجاتنا */}
        <div className="text-center md:text-right">
          <h3 className="mb-6 text-sm font-bold tracking-widest text-primary">منتجاتنا</h3>
          <ul className="space-y-4">
            {PRODUCTS.map((p) => (
              <li key={p.name} className="flex items-center justify-center gap-3 md:justify-start">
                {p.href ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-foreground transition hover:text-primary"
                  >
                    {p.name}
                    {p.sub && <span className="text-muted-foreground"> — {p.sub}</span>}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                    {p.sub && <span className="text-muted-foreground"> — {p.sub}</span>}
                  </span>
                )}
                <span className="text-muted-foreground/60">—</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-1 md:items-start">
            <a
              href="https://www.justlator.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              www.justlator.com
            </a>
            <a
              href="https://www.justlator.tech"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              www.justlator.tech
            </a>
          </div>
        </div>

        {/* روابط */}
        <div className="text-center md:text-right">
          <h3 className="mb-6 text-sm font-bold tracking-widest text-muted-foreground">روابط</h3>
          <ul className="space-y-4">
            {LINKS.map((l) => (
              <li key={l.label}>
                {"to" in l && l.to ? (
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    href={l.href}
                    target={l.href?.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="text-sm text-muted-foreground transition hover:text-primary"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-muted-foreground">
          © ٢٠٢٦ Justlator Technologies · جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
        متاح
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      قريباً
    </span>
  );
}
