# Input Sanitization for Clinical Data: Preventing Prompt Injection

Clinical data must be treated as untrusted input. We implement rigorous sanitization protocols that strip metadata, normalize EHR formats, and validate data integrity against cryptographic signatures. This prevents 'Prompt Injection' attacks where malicious data could attempt to override the AI's core medical directives.