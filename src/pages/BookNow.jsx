import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';

const BookNow = () => {
  const form = useRef();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    const formValues = Object.values(formData);
    if (formValues.some(value => value.trim() !== '')) {
      emailjs
        .sendForm('service_cdpn0y8', 'template_7jcb87g', form.current, {
          publicKey: 'g7s64zeO2nxvzPytZ',
        })
        .then(
          () => {
            console.log('SUCCESS!');
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              message: '',
            });
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
          },
          (error) => {
            console.log('FAILED...', error.text);
            alert('Something went wrong. Please email pyelight@gmail.com');
          },
        );
    } else {
      console.log('Form is empty. Email not sent.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center mb-6">Contact Me</h2>
      <form ref={form} onSubmit={sendEmail} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="border p-3 rounded-md"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="border p-3 rounded-md"
          />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border p-3 rounded-md"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="border p-3 rounded-md"
        />
        <textarea
          name="message"
          placeholder="Tell me about your shoot..."
          rows={4}
          value={formData.message}
          onChange={handleChange}
          required
          className="border p-3 rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Submit
        </button>
        {submitted && (
          <p className="text-green-600 text-center animate-pulse mt-2">
            Form submitted successfully!
            David will reach out shortly.
          </p>
        )}
      </form>
    </div>
  );
};

export default BookNow;
