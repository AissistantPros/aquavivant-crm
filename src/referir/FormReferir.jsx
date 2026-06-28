import React, { useState, useEffect } from 'react';
import { submitReferido } from './supabase';

const MODELOS = ['1 Recámara', '2 Recámaras', '3 Recámaras', 'PB Jardín', 'Penthouse'];

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: #0d1b2a;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }
  .card {
    background: #162032;
    border: 1px solid #1e3048;
    border-radius: 14px;
    padding: 40px 36px;
    width: 100%;
    max-width: 480px;
  }
  .logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26px;
    font-weight: 600;
    color: #2dd4bf;
    margin-bottom: 4px;
    letter-spacing: 0.02em;
  }
  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 28px;
  }
  .form-group { margin-bottom: 18px; }
  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
  }
  input, select, textarea {
    width: 100%;
    background: #0d1b2a;
    border: 1px solid #1e3048;
    border-radius: 8px;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.15s;
  }
  input:focus, select:focus, textarea:focus { border-color: #2dd4bf; }
  input::placeholder, textarea::placeholder { color: #334155; }
  select option { background: #162032; }
  .hint {
    font-size: 12px;
    color: #475569;
    margin-top: 5px;
  }
  .required { color: #f43f5e; margin-left: 2px; }
  .btn {
    width: 100%;
    background: #2dd4bf;
    color: #0d1b2a;
    border: none;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    padding: 13px;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.15s;
  }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn:not(:disabled):hover { opacity: 0.9; }
  .error-box {
    background: rgba(244,63,94,0.1);
    border: 1px solid rgba(244,63,94,0.35);
    border-radius: 8px;
    color: #f87171;
    font-size: 14px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }
  .success {
    text-align: center;
    padding: 16px 0;
  }
  .success-icon {
    font-size: 52px;
    margin-bottom: 16px;
  }
  .success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    color: #2dd4bf;
    margin-bottom: 10px;
  }
  .success-msg {
    font-size: 15px;
    color: #94a3b8;
    line-height: 1.6;
  }
  .divider {
    border: none;
    border-top: 1px solid #1e3048;
    margin: 22px 0;
  }
`;

export default function FormReferir() {
  const params = new URLSearchParams(window.location.search);
  const codigoUrl = (params.get('codigo') || '').toUpperCase();

  const [f, setF] = useState({
    codigo: codigoUrl,
    name: '',
    phone: '',
    email: '',
    modelo: '',
    notas: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const validPhone = /^\d{10}$/.test(f.phone.replace(/\s/g, ''));
  const canSubmit = f.codigo.trim() && f.name.trim() && validPhone && !sending;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setError('');
    try {
      await submitReferido({
        codigo: f.codigo.trim(),
        name: f.name.trim(),
        phone: f.phone.replace(/\s/g, ''),
        email: f.email.trim() || null,
        modelo: f.modelo || null,
        notas: f.notas.trim() || null,
      });
      setDone(true);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('no válido') || msg.includes('inactivo')) {
        setError('Código de referenciador no válido o inactivo. Verifica el código e intenta de nuevo.');
      } else {
        setError('Ocurrió un error al registrar. Por favor intenta de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="card">
        <div className="logo">Aqua Vivant</div>
        <div className="subtitle">Huayacán, Cancún · Registro de referido</div>

        {done ? (
          <div className="success">
            <div className="success-icon">✅</div>
            <div className="success-title">¡Registro exitoso!</div>
            <div className="success-msg">
              Tu referido fue registrado correctamente.<br />
              El equipo de ventas lo contactará pronto.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="error-box">{error}</div>}

            <div className="form-group">
              <label>Código de referenciador <span className="required">*</span></label>
              <input
                value={f.codigo}
                onChange={e => s('codigo', e.target.value.toUpperCase())}
                placeholder="Ej: AB12CD34"
                autoComplete="off"
              />
              {!codigoUrl && (
                <div className="hint">Si recibiste un link con tu código, ya estará pre-llenado.</div>
              )}
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label>Nombre del referido <span className="required">*</span></label>
              <input
                value={f.name}
                onChange={e => s('name', e.target.value)}
                placeholder="Nombre completo"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Teléfono <span className="required">*</span></label>
              <input
                value={f.phone}
                onChange={e => s('phone', e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="10 dígitos"
                inputMode="tel"
                maxLength={12}
              />
              {f.phone && !validPhone && (
                <div className="hint" style={{ color: '#f87171' }}>Debe tener 10 dígitos.</div>
              )}
            </div>

            <div className="form-group">
              <label>Email <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <input
                type="email"
                value={f.email}
                onChange={e => s('email', e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Modelo de interés <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <select value={f.modelo} onChange={e => s('modelo', e.target.value)}>
                <option value="">Sin preferencia</option>
                {MODELOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Notas adicionales <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              <textarea
                value={f.notas}
                onChange={e => s('notas', e.target.value)}
                placeholder="Contexto relevante sobre el referido…"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn" type="submit" disabled={!canSubmit}>
              {sending ? 'Registrando…' : 'Registrar referido'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
