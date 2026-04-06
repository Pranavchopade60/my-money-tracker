import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'person'
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('lendTrackerTransactions');
    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('lendTrackerTransactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTxn = {
      id: Date.now().toString(),
      personName: formData.get('personName').trim(),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      description: formData.get('description'),
      type: 'lent'
    };

    if (newTxn.personName && !isNaN(newTxn.amount)) {
      setTransactions([...transactions, newTxn]);
      setIsModalOpen(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(`Are you sure you want to clear all history with ${selectedPerson}? This cannot be undone.`)) {
      setTransactions(transactions.filter(t => t.personName !== selectedPerson));
      setView('dashboard');
      setSelectedPerson(null);
    }
  };

  // Compute aggregated data
  const peopleMap = transactions.reduce((acc, txn) => {
    if (!acc[txn.personName]) {
      acc[txn.personName] = { name: txn.personName, total: 0, count: 0 };
    }
    acc[txn.personName].total += txn.amount;
    acc[txn.personName].count += 1;
    return acc;
  }, {});

  const peopleList = Object.values(peopleMap).sort((a, b) => b.total - a.total);
  const totalLent = peopleList.reduce((sum, p) => sum + p.total, 0);

  const renderDashboard = () => (
    <>
      <div className="header">
        <h1>Money</h1>
      </div>

      <div className="stat-card glass">
        <h2>Total Given</h2>
        <p className="amount">₹{totalLent.toLocaleString()}</p>
      </div>

      {peopleList.length > 0 && (
        <div className="graph-container glass" style={{ padding: '16px', marginBottom: '32px', height: '220px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-dim)', textAlign: 'center' }}>Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={peopleList}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                stroke="rgba(255,255,255,0.05)"
                paddingAngle={2}
              >
                {peopleList.map((entry, index) => {
                  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
                  return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <h3 style={{ marginBottom: '16px' }}>People</h3>
      <div className="people-list">
        {peopleList.length === 0 ? (
          <div className="empty-state glass">
            <p>You haven't added any records yet.</p>
          </div>
        ) : (
          peopleList.map(p => (
            <div
              key={p.name}
              className="person-card glass"
              onClick={() => {
                setSelectedPerson(p.name);
                setView('person');
              }}
            >
              <div className="person-info">
                <h3>{p.name}</h3>
                <p>{p.count} transaction{p.count > 1 ? 's' : ''}</p>
              </div>
              <div className="person-amount">
                ₹{p.total.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="action-bar">
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span style={{ fontSize: '20px' }}>+</span> Add Record
        </button>
      </div>
    </>
  );

  const renderPersonView = () => {
    const personTxns = transactions
      .filter(t => t.personName === selectedPerson)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const personTotal = personTxns.reduce((sum, t) => sum + t.amount, 0);

    return (
      <>
        <div className="history-header">
          <button className="back-btn" onClick={() => { setView('dashboard'); setSelectedPerson(null); }}>
            ← Back
          </button>
          <h2>{selectedPerson}</h2>
          <div className="total-badge">₹{personTotal.toLocaleString()}</div>
        </div>

        <div className="transaction-list">
          {personTxns.map(t => (
            <div key={t.id} className="txn-card glass">
              <div className="txn-details">
                <h4>{t.description || 'No description'}</h4>
                <p>{new Date(t.date).toLocaleDateString()}</p>
              </div>
              <div className="txn-amount">
                ₹{t.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="action-bar" style={{ gap: '12px' }}>
          <button
            className="btn-secondary"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleClearHistory}
          >
            Clear History
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => setIsModalOpen(true)}
          >
            + Add to {selectedPerson}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      {view === 'dashboard' ? renderDashboard() : renderPersonView()}

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setIsModalOpen(false);
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Record</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Person Name</label>
                <input
                  name="personName"
                  type="text"
                  required
                  placeholder="pranav"
                  defaultValue={selectedPerson || ''}
                  readOnly={!!selectedPerson && view === 'person'}
                  style={!!selectedPerson && view === 'person' ? { opacity: 0.7 } : {}}
                />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input name="amount" type="number" required placeholder="00" min="-333" step="0.01" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input name="description" type="text" placeholder="e.g. Lunch yesterday" />
              </div>
              <button type="submit" className="btn-primary full" style={{ marginTop: '12px' }}>
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
