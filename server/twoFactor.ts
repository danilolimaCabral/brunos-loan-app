import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Gera um novo secret para TOTP (Time-based One-Time Password)
 */
export function generateTwoFactorSecret(username: string) {
  const secret = speakeasy.generateSecret({
    name: `Bruno's Loan (${username})`,
    issuer: "Bruno's Loan",
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
}

/**
 * Gera QR Code em formato Data URL para o usuário escanear
 */
export async function generateQRCode(otpauth_url: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw new Error('Falha ao gerar QR Code');
  }
}

/**
 * Verifica se o código TOTP fornecido é válido
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Permite 2 intervalos de tempo antes e depois (60s cada)
  });
}

/**
 * Gera códigos de backup para recuperação
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Gera código de 8 caracteres alfanuméricos
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verifica se um código de backup é válido
 */
export function verifyBackupCode(backupCodesJson: string | null, code: string): { valid: boolean; remainingCodes?: string[] } {
  if (!backupCodesJson) {
    return { valid: false };
  }

  try {
    const backupCodes: string[] = JSON.parse(backupCodesJson);
    const codeIndex = backupCodes.indexOf(code.toUpperCase());

    if (codeIndex !== -1) {
      // Remove o código usado
      const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
      return { valid: true, remainingCodes };
    }

    return { valid: false };
  } catch (error) {
    console.error('Erro ao verificar código de backup:', error);
    return { valid: false };
  }
}
