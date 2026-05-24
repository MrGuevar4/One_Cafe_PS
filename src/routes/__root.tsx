import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useTheme } from "@/lib/pos-store";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

/** Reads persisted theme and keeps <html data-theme> in sync across the app */
function ThemeInitializer() {
  useTheme(); // subscribes to theme changes and applies data-theme to <html>
  return null;
}


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">لاپەڕەکە نەدۆزرایەوە</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ئەو لاپەڕەیەی کە بەدوایدا دەگەڕێیت بوونی نییە یان گوازراوەتەوە.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            بچۆ سەرەکی
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          ئەم لاپەڕەیە بارنەکرا
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          کێشەیەک لە لایەن ئێمەوە ڕوویدا. دەتوانیت لاپەڕەکە نوێ بکەیتەوە یان بگەڕێیتەوە بۆ سەرەکی.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            دووبارە هەوڵبدەرەوە
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            بچۆ سەرەکی
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ONE Cafe & Restaurant — سیستمی فرۆشتن" },
      { name: "description", content: "سیستمی فرۆشتن بۆ ONE Cafe & Restaurant." },
      { property: "og:title", content: "ONE Cafe & Restaurant — سیستمی فرۆشتن" },
      { property: "og:description", content: "سیستمی فرۆشتن بۆ ONE Cafe & Restaurant." },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ku" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
