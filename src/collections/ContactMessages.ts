import type { CollectionConfig } from 'payload';

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  admin: {
    group: 'Audience & Submissions',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'createdAt'],
    description: 'Inbound audience messages, press inquiries, and correspondence.',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Inquirer Full Name',
          admin: {
            width: '50%',
            placeholder: 'e.g. Jordan Mitchell',
            description: 'Name of the sender submitting the contact inquiry.',
          },
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          label: 'Contact Email Address',
          admin: {
            width: '50%',
            placeholder: 'e.g. jordan@example.com',
            description: 'Reply email address provided by the sender.',
          },
        },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: 'Inquiry Message / Correspondence',
      admin: {
        placeholder: 'Full message body submitted via public contact form...',
        description: 'Audience message, sponsorship inquiry, or press correspondence.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'consent',
          type: 'checkbox',
          defaultValue: true,
          label: 'Privacy Policy Consent Granted',
          admin: {
            width: '33%',
            description: 'Sender accepted privacy terms at submission.',
          },
        },
        {
          name: 'consentTimestamp',
          type: 'date',
          label: 'Consent Timestamp',
          admin: {
            width: '33%',
            readOnly: true,
            description: 'Recorded submission timestamp.',
          },
        },
        {
          name: 'emailDeliveryFailed',
          type: 'checkbox',
          defaultValue: false,
          label: 'Email Alert Delivery Failed',
          admin: {
            width: '34%',
            description: 'Alert flag: true if staff email delivery failed.',
          },
        },
      ],
    },
  ],
};
