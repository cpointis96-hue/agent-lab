import { useLanguage } from "../i18n/language";

export function TrustBadge({ status }: { status: string }) { const { t } = useLanguage(); return <span className="trust-badge" title={t("trust.inert")}>{status}</span>; }
