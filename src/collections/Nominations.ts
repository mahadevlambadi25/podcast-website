import type { CollectionConfig } from 'payload';

export const Nominations: CollectionConfig = {
  slug: 'nominations',
  admin: {
    group: 'Audience & Submissions',
    useAsTitle: 'guestName',
    defaultColumns: ['guestName', 'guestRoleCompany', 'name', 'status', 'createdAt'],
    description: 'Vetting pipeline for incoming leader and guest nominations.',
  },
  access: {
    // Public can submit nominations via API/Form
    create: () => true,
    // Only authenticated staff can view/edit
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Nominee Information',
          description: 'Details and background about the nominated leader or executive.',
          fields: [
            {
              name: 'guestName',
              type: 'text',
              required: true,
              label: 'Nominee Full Name',
              admin: {
                placeholder: 'e.g. Dr. Elena Rostova',
                description: 'Full name of the executive, scientist, or pioneer being nominated.',
              },
            },
            {
              name: 'guestRoleCompany',
              type: 'text',
              label: 'Nominee Role & Organization',
              admin: {
                placeholder: 'e.g. Founder & Chief Scientist, Quantum Biosystems',
                description: 'Current leadership title and corporate or academic affiliation.',
              },
            },
            {
              name: 'profileLink',
              type: 'text',
              label: 'Nominee Profile / Website URL',
              admin: {
                placeholder: 'https://linkedin.com/in/... or https://company.com/team/...',
                description: 'Verified public profile or enterprise leadership biography link.',
              },
            },
            {
              name: 'reason',
              type: 'textarea',
              required: true,
              label: 'Why should they be featured on Unchartered?',
              admin: {
                placeholder:
                  'Describe the nominee’s achievements, pivotal decisions, leadership impact, and why their story embodies Legends & Legacies...',
                description: 'Editorial justification and context for the interview vetting committee.',
              },
            },
          ],
        },
        {
          label: 'Editorial Review & Status',
          description: 'Internal vetting pipeline status and confidential editorial notes.',
          fields: [
            {
              name: 'status',
              type: 'select',
              defaultValue: 'new',
              required: true,
              label: 'Vetting Pipeline Status',
              options: [
                { label: 'New — Awaiting initial vetting', value: 'new' },
                { label: 'Reviewed — Vetting approved by team', value: 'reviewed' },
                { label: 'Contacted — Outreach email sent', value: 'contacted' },
                { label: 'Declined — Does not match current season theme', value: 'declined' },
              ],
              admin: {
                description: 'Current stage in the guest acquisition and curation workflow.',
              },
              access: {
                update: ({ req: { user } }) => Boolean(user),
              },
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              label: 'Confidential Editorial & Vetting Notes',
              admin: {
                placeholder: 'Add internal research notes, vetting committee feedback, or outreach timeline...',
                description: 'Private team notes on candidate research, mutual connections, or scheduling notes.',
              },
              access: {
                read: ({ req: { user } }) => Boolean(user),
                update: ({ req: { user } }) => Boolean(user),
              },
            },
          ],
        },
        {
          label: 'Nominator & Audit Trail',
          description: 'Contact details of the person submitting the nomination and compliance timestamps.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: 'Nominator Full Name',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. Alex Vance',
                  },
                },
                {
                  name: 'email',
                  type: 'email',
                  required: true,
                  label: 'Nominator Email Address',
                  admin: {
                    width: '50%',
                    placeholder: 'e.g. alex@example.com',
                  },
                },
              ],
            },
            {
              name: 'consent',
              type: 'checkbox',
              required: true,
              label: 'Privacy Policy Consent Granted',
              admin: {
                description: 'Confirmation that nominator consented to the privacy policy upon submission.',
              },
            },
            {
              name: 'consentTimestamp',
              type: 'date',
              label: 'Consent Timestamp',
              admin: {
                readOnly: true,
                description: 'Immutable timestamp recorded at submission.',
              },
            },
            {
              name: 'emailDeliveryFailed',
              type: 'checkbox',
              defaultValue: false,
              label: 'Notification Email Delivery Failed',
              admin: {
                description: 'System alert flag: true if the editorial notification email could not be delivered.',
              },
            },
          ],
        },
      ],
    },
  ],
};
