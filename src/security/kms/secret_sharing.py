import secrets
from typing import List, Tuple

class ShamirSecretSharing:
    """
    Implements Shamir's Secret Sharing scheme over a prime field.
    Used for splitting the master key into N shares, requiring T shares to reconstruct.
    """
    PRIME = 2**256 - 189

    @classmethod
    def split_secret(cls, secret_bytes: bytes, threshold: int, num_shares: int) -> List[Tuple[int, bytes]]:
        """
        Splits a secret into N shares, requiring T (threshold) shares to reconstruct.
        """
        if threshold > num_shares:
            raise ValueError("Threshold cannot be greater than the total number of shares.")
        
        secret_int = int.from_bytes(secret_bytes, byteorder='big')
        if secret_int >= cls.PRIME:
            raise ValueError("Secret is too large for the finite field prime.")

        coefficients = [secret_int] + [secrets.randbelow(cls.PRIME) for _ in range(threshold - 1)]

        shares = []
        for x in range(1, num_shares + 1):
            y = 0
            for power, coeff in enumerate(coefficients):
                y = (y + coeff * pow(x, power, cls.PRIME)) % cls.PRIME
            shares.append((x, y.to_bytes(32, byteorder='big')))
        
        return shares

    @classmethod
    def reconstruct_secret(cls, shares: List[Tuple[int, bytes]]) -> bytes:
        """
        Reconstructs the secret from a list of shares using Lagrange interpolation.
        """
        if not shares:
            raise ValueError("No shares provided for reconstruction.")

        xs, ys = [], []
        for x, y_bytes in shares:
            xs.append(x)
            ys.append(int.from_bytes(y_bytes, byteorder='big'))

        secret_int = 0
        for i in range(len(shares)):
            numerator = 1
            denominator = 1
            for j in range(len(shares)):
                if i == j:
                    continue
                numerator = (numerator * -xs[j]) % cls.PRIME
                denominator = (denominator * (xs[i] - xs[j])) % cls.PRIME
            
            inv_denominator = pow(denominator, cls.PRIME - 2, cls.PRIME)
            lagrange_coefficient = (numerator * inv_denominator) % cls.PRIME
            secret_int = (secret_int + ys[i] * lagrange_coefficient) % cls.PRIME

        return secret_int.to_bytes(32, byteorder='big')