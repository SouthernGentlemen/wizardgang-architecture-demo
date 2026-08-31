# Identity demonstration plan

Authentication and authorization remain separate throughout the demo.

- OAuth 2.0 establishes delegated identity/access flows.
- SSO is the user experience of using an external enterprise identity provider.
- SAML is one enterprise federation protocol used by SSO integrations.
- Application authorization still decides what an authenticated identity may do.

The public repo may include provider-neutral configuration examples and non-secret metadata. Client secrets, signing keys, private certificates, tokens, and real tenant identifiers stay outside Git.

Implemented public demonstrations:

- OAuth 2.0 PKCE verifier/challenge/state generation without pretending a real provider authenticated a user;
- provider-neutral SSO trust-boundary responsibilities with an explicit unconfigured status;
- served SAML service-provider metadata plus the assertion validation requirements a real callback must enforce;
- a separate application policy evaluator where read access is broader than write access and write access requires an operator role plus MFA assurance.

The policy evaluator accepts a modeled authentication context for inspection. That public input is not a trusted login and never creates a session. Real OAuth/SSO/SAML authentication requires environment-owned provider configuration and mature protocol libraries or managed identity controls.
