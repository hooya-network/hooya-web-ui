import ClientCidPage from '@/components/ClientCidPage';

export default function Page({params}: {params: { cid: string}}) {
  return <ClientCidPage cid={params.cid} />;
}

