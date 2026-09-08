**Q1. An access token is stolen from a recruiter's browser. The attacker does not have the refresh token. What limits the damage — and what does not?**

Think about: what the attacker can do for the next 15 minutes; what they cannot do after the token expires; whether the legitimate user's password matters in this scenario; and whether any server-side action can shorten the 15-minute window.

If an attacker steals only an access token, they can use it until its 15-minute expiry. After it expires, they cannot generate a new access token without the refresh token. The access token cannot normally be revoked before expiry because JWT authentication is stateless.

Q**2. A colleague proposes storing refresh tokens as plaintext in the refresh_tokens table. "It's not a password — it's a random string, so there's nothing to brute-force." They are half right. Identify the specific attack scenario their proposal enables despite the "nothing to brute-force" argument, and explain why hashing with SHA-256 closes it. Then explain why bcrypt — the right choice for passwords — would be unnecessary for this case and what property of passwords makes bcrypt necessary there but not here.**

Storing refresh tokens in plaintext is dangerous because a database leak would give attackers working tokens that they could directly use. SHA-256 hashing protects against this by ensuring the database stores only hashes. bcrypt is needed for passwords because passwords can be guessed, while refresh tokens are high-entropy random values.

**Q3. Your system uses HS256 (symmetric) JWT signing. A frontend developer asks: "Can we let a third-party analytics service verify the JWT signature locally — on their own server, without calling our API — to confirm the user's role before displaying certain dashboard widgets?"**

**What is the problem with sharing what they would need to do that, and what signing scheme would let them verify tokens without creating that risk?**



HS256 uses the same secret for signing and verification, so sharing it with a third party would allow them to create fake tokens. RS256 solves this by using a private key for signing and a public key for verification.

**An access token is valid for 15 minutes. A recruiter's account is compromised at 09:00. The attacker is detected and the admin revokes the refresh token at 09:08. The attacker's access token was issued at 09:00. What can the attacker do between 09:08 and 09:15 — and what can they not do? Write this out in your own words.**

Revoking a refresh token stops an attacker from generating new access tokens, but an already issued access token remains valid until it expires. Therefore, in the example, the attacker can continue making requests until 09:15 but cannot create a new session afterward.

**You are designing a new endpoint: POST /auth/logout. The client sends its refresh token. What does the server need to do — and what does it not need to do — to fully terminate the session?**

On logout, the server deletes the refresh token from the database. This prevents new access tokens from being generated. The current access token does not need to be deleted because it will expire naturally after its short lifetime.