import React from 'react';
import { notFound } from 'next/navigation';
import { getEpisodeById } from '@/services/episodes.service';
import { EpisodeEditor } from '@/components/admin/EpisodeEditor';

export default async function EditEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    notFound();
  }

  const episode = await getEpisodeById(numId);
  if (!episode) {
    notFound();
  }

  return <EpisodeEditor initialData={episode} isNew={false} />;
}
