import Layout from "@/components/layout/Layout";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
