import "./globals.css";
import { Inter } from "next/font/google";
import QueryClientProviderComponent from "@/utils/layout"; 
import { NotistackProvider } from "../app/context/notistackContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Mapeamento de Acessibilidade",
  description: "Aplicação para mapear a acessibilidade de instituições.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProviderComponent>
      <html className="h-full w-full bg-color-pink" lang="pt-BR">
        <body className={inter.className}>
          <NotistackProvider>
            {children}
          </NotistackProvider>
        </body>
      </html>
    </QueryClientProviderComponent>
  );
}
