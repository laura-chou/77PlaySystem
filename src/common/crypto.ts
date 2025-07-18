import crypto from "crypto";

const algorithm = "aes-256-cbc";

export const encrypt = (text: string) : string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET!).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final()
  ]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string) : string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET!).digest();
  const [ivHex, encryptedHex] = text.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
};