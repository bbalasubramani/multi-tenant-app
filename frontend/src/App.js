import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://multi-tenant-app-zeta.vercel.app/'; 

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });


  useEffect(() => {
    if (token) {
      fetchNotes();
      const decodedUser = JSON.parse(atob(token.split('.')[1]));
      setUser(decodedUser);
    }
  }, [token]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, loginForm);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      const decodedUser = JSON.parse(atob(response.data.token.split('.')[1]));
      setUser(decodedUser);
      setError('');
    } catch (err) {
      setError('Login failed: Invalid credentials');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/notes`, { content: noteContent }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNoteContent('');
      fetchNotes();
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create note');
      }
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setNotes([]);
  };

  const handleUpgrade = async () => {
    if (!user || user.role !== 'admin') {
      return setError('Only admins can upgrade');
    }
    try {
      await axios.post(`${API_BASE_URL}/tenants/${user.tenant}/upgrade`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setError('Tenant successfully upgraded to Pro!');
    } catch (err) {
      setError('Upgrade failed');
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>Notes App</h1>
        <p>Logged in as {user.email} (Role: {user.role}, Tenant: {user.tenant})</p>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <div className="notes-section">
        <div className="notes-list">
          <h3>Your Notes</h3>
          {notes.length === 0 ? <p>No notes yet.</p> : notes.map(note => (
            <div key={note.id} className="note-card">
              <p>{note.content}</p>
            </div>
          ))}
          {user.role === 'member' && notes.length >= 3 && (
            <div className="upgrade-message">
              <p>You have reached the note limit for the Free Plan.</p>
              <p>Ask your admin to upgrade to Pro for unlimited notes!</p>
            </div>
          )}
        </div>
        <div className="create-note-form">
          <h3>Create a New Note</h3>
          <form onSubmit={handleCreateNote}>
            <textarea
              placeholder="Write your note here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
            />
            <button type="submit">Create Note</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
        {user.role === 'admin' && (
          <div className="admin-actions">
            <h3>Admin Actions</h3>
            <button onClick={handleUpgrade}>Upgrade to Pro</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
