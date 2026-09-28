import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MotionProvider } from "@/components/site/MotionProvider";
import { loadPage, type LocaleParams } from "@/lib/page";

export default async function SiteLayout({ children, params }: LocaleParams & { children: React.ReactNode }) {
  const { locale, dict, content } = await loadPage(params);

  return (
    <MotionProvider>
      <Header locale={locale} dict={dict} />
      <main>{children}</main>
      <Footer dict={dict} company={content.company} services={content.serviceTypes} locale={locale} />
    </MotionProvider>
  );
}
