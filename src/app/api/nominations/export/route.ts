import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listNominations } from '@/services/nominations.service';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET() {
  try {
    // Authenticate user session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { docs } = await listNominations({ limit: 1000 });

    const csvHeaders = [
      'ID',
      'Created At',
      'Nominee Name',
      'Nominee Role & Company',
      'Nominator Name',
      'Nominator Email',
      'Status',
      'Profile Link',
      'Why Featured',
      'Internal Notes',
      'Email Delivery Failed',
    ];

    const rows = docs.map((doc) => [
      escapeCsvField(doc.id),
      escapeCsvField(doc.created_at),
      escapeCsvField(doc.guest_name),
      escapeCsvField(doc.guest_role_company),
      escapeCsvField(doc.name || ''),
      escapeCsvField(doc.email || ''),
      escapeCsvField(doc.status),
      escapeCsvField(doc.profile_link || ''),
      escapeCsvField(doc.reason || ''),
      escapeCsvField(doc.internal_notes || ''),
      escapeCsvField(doc.email_delivery_failed ? 'Yes' : 'No'),
    ]);

    const csvString = [
      csvHeaders.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\r\n');

    return new Response(csvString, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="unchartered-nominations.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('Failed to export nominations CSV:', err);
    return NextResponse.json({ error: 'Failed to generate CSV export.' }, { status: 500 });
  }
}
