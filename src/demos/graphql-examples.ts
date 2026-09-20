export const GRAPHQL_EXAMPLES = Object.freeze([
  Object.freeze({ title: 'List users', query: 'query Users { users { id name email role } }' }),
  Object.freeze({ title: 'Read one user', query: 'query User { user(id: "user-001") { id name email role } }' }),
]);
