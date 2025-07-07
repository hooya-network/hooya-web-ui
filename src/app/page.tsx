import ClientHomepage from '@/components/ClientHomepage';

export default function Homepage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  return <ClientHomepage searchParams={searchParams} />;
}
