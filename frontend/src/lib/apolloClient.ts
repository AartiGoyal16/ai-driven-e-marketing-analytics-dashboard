import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
});

const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      const isUnauthorized =
        err.extensions?.code === 'UNAUTHENTICATED' ||
        err.message?.toLowerCase().includes('unauthorized') ||
        err.message?.toLowerCase().includes('logged in');

      if (isUnauthorized) {
        if (typeof window !== 'undefined') {
          // Clear Apollo store cache
          client.clearStore().catch(() => {});

          // Redirect to login if not already on public auth pages
          const pathname = window.location.pathname;
          if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
            window.location.href = '/login?reason=expired';
          }
        }
        break;
      }
    }
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;