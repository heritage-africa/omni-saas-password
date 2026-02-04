import { TestBed } from '@angular/core/testing';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('evaluatePasswordStrength', () => {
    it('should return 0 for empty password', () => {
      expect(service.evaluatePasswordStrength('')).toBe(0);
    });

    it('should return 1 for password with only length', () => {
      expect(service.evaluatePasswordStrength('password')).toBe(1);
    });

    it('should return 2 for password with length and uppercase', () => {
      expect(service.evaluatePasswordStrength('Password')).toBe(2);
    });

    it('should return 3 for password with length, uppercase and numbers', () => {
      expect(service.evaluatePasswordStrength('Password123')).toBe(3);
    });

    it('should return 4 for strong password', () => {
      expect(service.evaluatePasswordStrength('Password123!')).toBe(4);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = service.validatePassword('Password123!');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should fail for short password', () => {
      const result = service.validatePassword('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('should fail for password without uppercase', () => {
      const result = service.validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le mot de passe doit contenir au moins une lettre majuscule');
    });
  });

  describe('passwordsMatch', () => {
    it('should return true for matching passwords', () => {
      expect(service.passwordsMatch('password', 'password')).toBe(true);
    });

    it('should return false for non-matching passwords', () => {
      expect(service.passwordsMatch('password', 'different')).toBe(false);
    });

    it('should return false for empty passwords', () => {
      expect(service.passwordsMatch('', '')).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of default length', () => {
      const password = service.generateSecurePassword();
      expect(password.length).toBe(16);
    });

    it('should generate password of specified length', () => {
      const password = service.generateSecurePassword(20);
      expect(password.length).toBe(20);
    });

    it('should contain uppercase letters', () => {
      const password = service.generateSecurePassword();
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should contain lowercase letters', () => {
      const password = service.generateSecurePassword();
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should contain numbers', () => {
      const password = service.generateSecurePassword();
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should contain special characters', () => {
      const password = service.generateSecurePassword();
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await service.hashPassword('password');
      expect(hash).toBe(btoa('password'));
    });
  });
});
