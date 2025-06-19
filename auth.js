// auth.js

// Use environment variables if available, otherwise fallback to hardcoded values
const SUPABASE_URL = window?.SUPABASE_URL || 'https://vjjqsbupupmdfqulidpr.supabase.co';
const SUPABASE_ANON_KEY = window?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqanFzYnVwdXBtZGZxdWxpZHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTM1MTgsImV4cCI6MjA2NTgyOTUxOH0.wNGR-blLYp6r3d0_DF2-7ODz-Zez04bRJBkGBawc_Z8';

// Initialize Supabase client (assumes @supabase/supabase-js is loaded or available globally)
const supabase = window.createClient
  ? window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign up a new user
async function signUp(email, password, full_name = '', phone_number = '', address = '', avatar_url = '', bio = '', location = '', website = '') {
  try {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = 'Creating account...';
    }

    // Disable email confirmation
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email },
        emailRedirectTo: undefined
      }
    });

    if (error) throw error;

    // Sign in the user to get a valid JWT for RLS
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    const userId = signInData.user && signInData.user.id;
    console.log('Supabase user.id after signIn:', userId);
    if (userId) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{ 
          id: userId, 
          email, 
          full_name, 
          phone_number, 
          address, 
          avatar_url, 
          bio, 
          location, 
          website, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      if (profileError) throw new Error('Failed to create user profile: ' + profileError.message);
    } else {
      throw new Error('User ID is missing after sign in.');
    }

    alert('Signup successful! Redirecting to dashboard...');
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert(error.message || 'Signup failed');
  } finally {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerText = 'Create Account';
    }
  }
}

// Sign in an existing user
async function signIn(email, password) {
  try {
    // Trim and validate input
    email = (email || '').trim();
    password = (password || '').trim();
    if (!email || !password) {
      alert('Email and password are required.');
      return;
    }
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = 'Signing in...';
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profileError && profile) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
    localStorage.setItem('user', JSON.stringify(data.user));

    // After successful login, redirect using the correct GitHub Pages project path
    updateUIForAuthenticatedUser(data.user);
    window.location.href = '/AgriHub/dashboard.html';
  } catch (error) {
    alert(error.message || 'Login failed');
  } finally {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerText = 'Sign In';
    }
  }
}

// Sign out the current user
async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile');
    window.location.href = '/index.html';
  } catch (error) {
    alert(error.message || 'Logout failed');
  }
}

// Get the current user's profile
async function getProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    localStorage.setItem('userProfile', JSON.stringify(data));
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update the current user's profile
async function updateProfile(profileData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    localStorage.setItem('userProfile', JSON.stringify(data));
    updateUIForAuthenticatedUser(user);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Session management and UI helpers
async function checkUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      updateUIForAuthenticatedUser(user);
    } else {
      updateUIForUnauthenticatedUser();
    }
  } catch (error) {
    // Optionally handle error
  }
}

function updateUIForAuthenticatedUser(user) {
  document.querySelectorAll('[data-auth="signin"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('[data-auth="signout"]').forEach(el => el.style.display = 'block');
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);

  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (profile) {
    document.querySelectorAll('[data-user-name]').forEach(el =>
      el.textContent = profile.full_name || 'User'
    );
    document.querySelectorAll('[data-user-avatar]').forEach(el => {
      if (el.tagName.toLowerCase() === 'img' && profile.avatar_url) {
        el.src = profile.avatar_url;
      }
    });
  }
}

function updateUIForUnauthenticatedUser() {
  document.querySelectorAll('[data-auth="signin"]').forEach(el => el.style.display = 'block');
  document.querySelectorAll('[data-auth="signout"]').forEach(el => el.style.display = 'none');
}

// Listen for auth state changes
if (supabase?.auth?.onAuthStateChange) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      checkUser();
    } else if (event === 'SIGNED_OUT') {
      updateUIForUnauthenticatedUser();
    }
  });
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', checkUser);

// Export functions for use in other modules (if using ES modules or bundlers)
window.supabaseAuth = {
  signUp,
  signIn,
  signOut,
  getProfile,
  updateProfile,
  checkUser
};