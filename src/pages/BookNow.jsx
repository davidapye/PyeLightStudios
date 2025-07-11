import React, { useState, useRef } from 'react';
import './BookNow.css';
import emailjs from '@emailjs/browser';

const BookNow = () => {

    const form = useRef();

    const sendEmail = async (e) => {
        e.preventDefault();

        const formData = new FormData(form.current);
        const formValues = Object.fromEntries(formData.entries());
        
        // Check if formValues contain any values
    if (Object.values(formValues).some(value => value.trim() !== '')) 
    {
        emailjs
        .sendForm('service_cdpn0y8', 'template_7jcb87g', form.current, {
            publicKey: 'g7s64zeO2nxvzPytZ',
        })
        .then(
            () => {
            console.log('SUCCESS!');
            e.target.reset();
            },
            (error) => {
            console.log('FAILED...', error.text);
            alert(('Something went wrong. Please email pyelight@gmail.com'));
            },
        );
    }
    else
    {
        console.log("Form is empty. Email not sent.");
    }
    };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    description: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmationMessage = `Hi ${formData.firstName}, thank you for reaching out! I’ll contact you shortly to confirm your photoshoot.`;

    try {
      const response = await fetch('https://sangria-fossa-1922.twil.io/Test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          phone: formData.phone,
          message: confirmationMessage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus('Thank you! A confirmation text has been sent.');
      } else {
        setStatus('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setStatus('Error sending SMS. Please check your phone number.');
    }
  };

  return (
    <div className="book-now-container">
      <h2>Contact Me</h2>
      <form ref={form} onSubmit={sendEmail}>
        <input type='text' name="firstname" placeholder='First name' required/>
        <input type='text' name="lastname" placeholder='Last name' required/> 
        <input type='text' name="email" placeholder='Email' required/>
        <input type='text' name="phonenumber" placeholder='Phone Number' required/>
        <textarea type="text" name='message' placeholder='Tell me about your shoot...' rows={3} required/>
        <button type="submit">Submit</button>
      </form>
      {status && <p>{status}</p>}
    </div>

     /* <div className='contact-form-content'>
     <form ref={form} onSubmit={sendEmail}>
        <div className='name-container'>
            <Reveal>
                <input type='text' name="firstname" placeholder='First name'/>
            </Reveal>
            <Reveal>
                <input type='text' name="lastname" placeholder='Last name'/> 
            </Reveal>     
        </div>
        <Reveal>
            <input type='text' name="email" placeholder='Email'/>
        </Reveal>
        <Reveal>
            <textarea type="text" name='message' placeholder='Message' rows={3}/>
        </Reveal>
        <Reveal>
            <Button type="submit">Send</Button>
        </Reveal>
    </form>
    </div> */
  );
};

export default BookNow;
