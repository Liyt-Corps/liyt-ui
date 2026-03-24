import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com';

export interface ApiKey {
    id: number;
    business_id: number;
    name: string;
    prefix: string;
    scopes: string[];
    last_used_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    created_by_user_id: number | null;
    revoked_by_user_id: number | null;
    created_at: string;
    updated_at: string;
    plaintext_key: string | null;
}

export interface CreateApiKeyRequest {
    name: string;
    scopes?: string[];
    expires_at?: string;
}

export interface RotateApiKeyRequest {
    id: number;
    name?: string;
    scopes?: string[];
    expires_at?: string | null;
}

export interface BusinessSettings {
    id?: number;
    business_id?: number;
    pickup_address1: string | null;
    pickup_address2: string | null;
    pickup_city: string | null;
    pickup_region: string | null;
    pickup_postal_code: string | null;
    pickup_country_code: string | null;
    pickup_latitude: string | null;
    pickup_longitude: string | null;
    pickup_contact_name: string | null;
    pickup_contact_phone: string | null;
    pickup_instructions: string | null;
    created_at?: string;
    updated_at?: string;
}

export type UpdateBusinessSettingsRequest = Partial<BusinessSettings>;

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as { auth?: { accessToken?: string | null } };
            const stateToken = state.auth?.accessToken;
            const localToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
            const token = stateToken || localToken || sessionToken;

            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ['ApiKey', 'BusinessSettings'],
    endpoints: (builder) => ({
        getApiKeys: builder.query<ApiKey[], void>({
            query: () => '/api_keys',
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: 'ApiKey' as const, id })),
                          { type: 'ApiKey', id: 'LIST' },
                      ]
                    : [{ type: 'ApiKey', id: 'LIST' }],
        }),

        createApiKey: builder.mutation<ApiKey, CreateApiKeyRequest>({
            query: (body) => ({
                url: '/api_keys',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'ApiKey', id: 'LIST' }],
        }),

        revokeApiKey: builder.mutation<ApiKey, number>({
            query: (id) => ({
                url: `/api_keys/${id}/revoke`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'ApiKey', id }, { type: 'ApiKey', id: 'LIST' }],
        }),

        rotateApiKey: builder.mutation<ApiKey, RotateApiKeyRequest>({
            query: ({ id, ...body }) => ({
                url: `/api_keys/${id}/rotate`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'ApiKey', id }, { type: 'ApiKey', id: 'LIST' }],
        }),

        getBusinessSettings: builder.query<BusinessSettings, void>({
            query: () => '/business_settings',
            providesTags: [{ type: 'BusinessSettings', id: 'CURRENT' }],
        }),

        updateBusinessSettings: builder.mutation<BusinessSettings, UpdateBusinessSettingsRequest>({
            query: (body) => ({
                url: '/business_settings',
                method: 'PATCH',
                body,
            }),
            invalidatesTags: [{ type: 'BusinessSettings', id: 'CURRENT' }],
        }),
    }),
});

export const {
    useGetApiKeysQuery,
    useCreateApiKeyMutation,
    useRevokeApiKeyMutation,
    useRotateApiKeyMutation,
    useGetBusinessSettingsQuery,
    useUpdateBusinessSettingsMutation,
} = apiSlice;
