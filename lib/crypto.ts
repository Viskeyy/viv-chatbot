// const iv = crypto.getRandomValues(new Uint8Array(16))
// const crypto_iv = Buffer.from(iv).toString('base64')
// const iv = Buffer.from(crypto_iv,'base64')

// export const generateKey = async () => {
//     const key = await window.crypto.subtle.generateKey(
//         {
//             name: 'AES-GCM',
//             length: 128,
//         },
//         true,
//         ['encrypt', 'decrypt'],
//     )
//     const jwk = await crypto.subtle.exportKey('jwk', key)
//     return JSON.stringify(jwk)
// }

// export const parseKey = async (apikey: string) => {
//     const jwk = JSON.parse(apikey)
//     const key = await window.crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
//     return key
// }

// export const encrypt = async (plaintext: string): Promise<string> => {
//     const ctBuf = await crypto.subtle.encrypt(
//         { name: CRYPTO_NAME, iv: CRYPTO_IV, tagLength: CRYPTO_TAG_LENGTH },
//         await CRYPTO_KEY,
//         new TextEncoder().encode(plaintext),
//     )
//     return Buffer.from(ctBuf).toString('base64')
// }

// export const decrypt = async (ciphertext: string): Promise<string> => {
//     const ctBuf = await crypto.subtle.decrypt(
//         { name: CRYPTO_NAME, iv: CRYPTO_IV, tagLength: CRYPTO_TAG_LENGTH },
//         await CRYPTO_KEY,
//         Buffer.from(ciphertext, 'base64'),
//     )
//     return new TextDecoder().decode(ctBuf)
// }
