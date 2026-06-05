# Homomorphic Encryption for Mental Health

We utilize the CKKS (Cheon-Kim-Kim-Song) scheme to perform AI inference on psychiatric records without decryption.

## Logic
- The AI model processes encrypted vectors representing patient trauma and behavioral patterns.
- Results are returned in encrypted form, decryptable only by the patient's local device.
- This ensures that the AI can identify patterns and suggest cures for mental illness while maintaining absolute patient privacy.