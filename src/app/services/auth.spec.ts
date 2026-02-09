import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return user email from localStorage', () => {
    const mockUser = { email: 'test@example.com', username: 'testuser' };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    expect(service.getUserEmail()).toBe('test@example.com');

    localStorage.removeItem('currentUser');
  });

  it('should return empty string if currentUser is not in localStorage', () => {
    localStorage.removeItem('currentUser');
    expect(service.getUserEmail()).toBe('');
  });

  it('should return username if email is not available', () => {
    const mockUser = { username: 'johndoe' };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    expect(service.getUserEmail()).toBe('johndoe');

    localStorage.removeItem('currentUser');
  });

  it('should handle JSON parsing error gracefully', () => {
    localStorage.setItem('currentUser', 'invalid json');

    expect(service.getUserEmail()).toBe('');

    localStorage.removeItem('currentUser');
  });
});
