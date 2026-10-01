'use client';

import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import client from '@/lib/apolloClient';

export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}