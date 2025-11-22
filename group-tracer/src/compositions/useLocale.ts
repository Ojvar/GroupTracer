import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";

const languages = ["fa-IR", "en-US"] as const;
type SupportedLang = (typeof languages)[number];

export function useLocale() {
  const { t: $t, locale } = useI18n();
  const $q = useQuasar();

  async function setLang(lang: SupportedLang) {
    const langLoaders: Record<SupportedLang, () => Promise<{ default: any }>> =
      {
        "fa-IR": () => import("quasar/lang/fa-IR"),
        "en-US": () => import("quasar/lang/en-US"),
      };

    const langPack = await langLoaders[lang]();
    $q.lang.set(langPack.default);
    locale.value = lang;
  }

  return { $t, locale, languages, setLang };
}
