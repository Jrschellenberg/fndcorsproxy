import * as crypto from 'node:crypto';

// Loading the keys
const privateKey = Buffer.from(process.env.PRIVATE_KEY_BASE_64 , 'base64').toString('ascii')
const publicKey = Buffer.from(process.env.PUBLIC_KEY_BASE_64 , 'base64').toString('ascii')




export const handler = async () => {
  // Original data
  const data = 'my secret data';

// Encryption with public key
  const encryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      // We convert the data string to a buffer using 'utf8' encoding
      Buffer.from(data)
  );

  console.log("encypted data: ", encryptedData.toString("base64"));

// Decryption with private key
  const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        // In order to decrypt the data, we need to specify the
        // same hashing function and padding scheme that we used to
        // encrypt the data in the first place
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedData
  );

// The decrypted data is of the Buffer type, which we can convert to a
// string to reveal the original data
  console.log("decrypted data: ", decryptedData.toString());


  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Encrypted ${encryptedData.toString("base64")}\n\nDecrypted: ${decryptedData.toString()}`
    })
  }
}