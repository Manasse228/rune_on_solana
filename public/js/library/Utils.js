

export function truncatePublicKey(publicKey) {
    return `${publicKey.slice(0, 6)}...${publicKey.slice(-5)}`;
}

