import { ThreadViewPage } from '../../components/ThreadViewPage';

export default async function Page({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  return <ThreadViewPage tid={tid}/>;
}

