import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';

export default function BookNow() {
  const form = useRef(null);
  const [status, setStatus] = useState('');
  const sendEmail = async (event) => {
    event.preventDefault();
    setStatus('sending');
    try {
      await emailjs.sendForm('service_cdpn0y8', 'template_7jcb87g', form.current, { publicKey: 'g7s64zeO2nxvzPytZ' });
      form.current.reset();
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };
  return <main className="book-page">
    <section className="book-intro"><p className="eyebrow">LET’S MAKE SOMETHING MEANINGFUL</p><h1>Start with<br/><em>your story.</em></h1><p>Tell me a little about the moments you want to remember. I’ll be in touch within one business day to plan the details together.</p><p><strong>45-minute portrait session · $100</strong></p></section>
    <section className="book-card"><h2>Booking request</h2>
      <form ref={form} onSubmit={sendEmail} className="book-form">
        <div className="form-row">
          <label>First name<input name="firstname" type="text" autoComplete="given-name" required /></label>
          <label>Last name<input name="lastname" type="text" autoComplete="family-name" required /></label>
        </div>
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <label>Phone number<input name="phonenumber" type="tel" autoComplete="tel" required /></label>
        <label>Tell me about your shoot<textarea name="message" rows="5" required /></label>
        <button className="button button-light book-submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send booking request'}</button>
        <p className="form-note" aria-live="polite">{status === 'success' ? 'Thank you — your request is on its way. I’ll reply within one business day.' : status === 'error' ? 'Something went wrong. Please email pyelight@gmail.com and I’ll be glad to help.' : 'No commitment yet — this is just the beginning of a conversation.'}</p>
      </form>
    </section>
  </main>;
}
