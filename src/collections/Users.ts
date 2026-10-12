import type { CollectionConfig } from 'payload';

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).{8,}$/;

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 7200,
  },
  admin: {
    group: 'Settings & Administration',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'createdAt'],
    description: 'Editorial team accounts and role permissions (Administrator / Editor).',
    components: {
      views: {
        list: {
          Component: '/components/admin/views/UsersListView#UsersListView',
        },
      },
    },
  },
  access: {
    // Only admins can create or delete users
    create: ({ req: { user } }) => user?.role === 'admin',
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return { id: { equals: user?.id } };
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data;
        // Enforce password strength if setting or changing password
        if (data.password) {
          if (!STRONG_PASSWORD_REGEX.test(data.password)) {
            throw new Error(
              'Password must be at least 8 characters long and include at least one letter, one number, and one special character.'
            );
          }
        }
        // Non-admins cannot alter their own or others' roles
        if (data.role && req.user && req.user.role !== 'admin' && operation === 'update') {
          delete data.role;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: 'Role & Permission Level',
      admin: {
        description:
          'Administrators have full access to platform settings, redirects, and user management. Editors can create, edit, and publish episodes, guests, and media.',
      },
      options: [
        { label: 'Administrator — Full platform management & user administration', value: 'admin' },
        { label: 'Editor — Content creation, curation & publishing', value: 'editor' },
      ],
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
};
