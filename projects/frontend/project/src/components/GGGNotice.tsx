import { useTranslation } from "react-i18next";

export default function GGGNotice() {
  const { t } = useTranslation();
  return <span>{t("ggg_notice")}</span>;
}
