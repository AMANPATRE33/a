import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as apiService from './services/apiService';

// Mock the API services
vi.mock('./services/apiService', () => ({
  fetchStatus: vi.fn(),
  fetchTableStatus: vi.fn(),
  fetchCameraFeeds: vi.fn(),
  loginUser: vi.fn(),
  fetchMenu: vi.fn(() => Promise.resolve([])),
  registerGlobalErrorCallback: vi.fn(),
  fetchReviews: vi.fn(() => Promise.resolve([])),
  fetchAnalytics: vi.fn(() => Promise.resolve({}))
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login screen initially', () => {
    render(<App />);
    expect(screen.getAllByText(/Smart Anna/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/rahul@upl/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('switches between student and admin login modes', () => {
    render(<App />);
    const adminToggle = screen.getByText(/Admin/i);
    fireEvent.click(adminToggle);
    
    expect(screen.getByPlaceholderText(/Enter username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    
    const studentToggle = screen.getByText(/Student/i);
    fireEvent.click(studentToggle);
    expect(screen.getByPlaceholderText(/rahul@upl/i)).toBeInTheDocument();
  });

  it('handles successful student login and navigates to dashboard', async () => {
    (apiService.loginUser as any).mockResolvedValue({ 
      id: 'stu-123', 
      email: 'test@upl', 
      name: 'Test', 
      role: 'STUDENT' 
    });
    (apiService.fetchStatus as any).mockResolvedValue({ 
      people_inside: 10, 
      status: 'FREE' 
    });

    render(<App />);
    
    const emailInput = screen.getByPlaceholderText(/rahul@upl/i);
    const loginButton = screen.getByRole('button', { name: /Access Portal/i });

    fireEvent.change(emailInput, { target: { value: 'test@upl' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Live Canteen Status/i)).toBeInTheDocument();
      expect(screen.getByText(/DASHBOARD/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failed login', async () => {
    (apiService.loginUser as any).mockResolvedValue(null);

    render(<App />);
    
    const emailInput = screen.getByPlaceholderText(/rahul@upl/i);
    const loginButton = screen.getByRole('button', { name: /Access Portal/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@test' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/Authentication Error/i)).toBeInTheDocument();
    });
  });
});
