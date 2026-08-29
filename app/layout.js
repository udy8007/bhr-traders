export const metadata = {
  metadataBase: new URL("https://www.bhrtraders.com"),
  title: "BHR TRADERS — Wholesale Rice Traders in Chennai",
  description:
    "BHR TRADERS is a wholesale rice trader in Anna Nagar West, Chennai. Boiled, raw, steam, idly and biryani rice with GST billing, hygienic packing and reliable city-wide supply.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
