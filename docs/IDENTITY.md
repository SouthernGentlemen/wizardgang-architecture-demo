# Identity demonstration plan

Authentication and authorization remain separate throughout the demo.

- OAuth 2.0 establishes delegated identity/access flows.
- SSO is the user experience of using an external enterprise identity provider.
- SAML is one enterprise federation protocol used by SSO integrations.
- Application authorization still decides what an authenticated identity may do.

The public repo may include provider-neutral configuration examples and non-secret metadata. Client secrets, signing keys, private certificates, tokens, and real tenant identifiers stay outside Git.
