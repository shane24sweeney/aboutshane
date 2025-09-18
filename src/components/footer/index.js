import React from 'react';

function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'black',
        color: 'white',
        padding: '12px 8px',
        textAlign: 'center',
        borderTop: '1px solid #222',
        marginTop: '24px',
      }}
    >
      <div style={{ marginBottom: 4 }}>
        SHANE JAMES SWEENEY{' '}
        <a href="mailto:shane24sweeney@yahoo.com" style={{ color: 'white', textDecoration: 'underline' }}>
          shane24sweeney@yahoo.com
        </a>
      </div>
      <div>
        Kennesaw, GA{' '}
        <a
          href="https://linkedin.com/in/shane-sweeney-37a934135"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'white', textDecoration: 'underline' }}
        >
          Linkedin.com/in/shane-sweeney-37a934135
        </a>
      </div>
    </footer>
  );
}

export default Footer;
