import { notFound } from 'next/navigation';
import * as shareLinkQueries from '@/lib/queries/share-links';
import { ShareViewPage } from '@/components/share/share-view-page';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.token;

  try {
    const shareLink = await shareLinkQueries.getShareLinkByToken(token);

    if (!shareLink || !shareLink.file) {
      notFound();
    }

    return (
      <ShareViewPage
        shareLink={{
          id: shareLink.id,
          fileId: shareLink.fileId,
          file: {
            id: shareLink.file.id,
            name: shareLink.file.name,
            type: shareLink.file.type,
            mimeType: shareLink.file.mimeType,
            size: shareLink.file.size,
          },
          expiresAt: shareLink.expiresAt,
          createdAt: shareLink.createdAt,
        }}
        token={token}
      />
    );
  } catch (error: any) {
    console.error('Failed to load share link:', error);
    notFound();
  }
}

