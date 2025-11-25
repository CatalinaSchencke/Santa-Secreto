import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Santa Secreto',
  description: 'Aplicación de intercambio de regalos navideños',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}