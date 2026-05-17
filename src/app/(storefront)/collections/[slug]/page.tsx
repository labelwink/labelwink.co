import { redirect } from 'next/navigation';

/** Legacy /collections/:slug URLs → shop page with collection filter. */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === 'all') {
    redirect('/products');
  }

  redirect(`/products?collection=${encodeURIComponent(slug)}`);
}
