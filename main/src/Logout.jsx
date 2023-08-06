// Logout.js
import { useEffect } from 'react';
import Cookies from 'js-cookie';

function Logout() {
  useEffect(() => {
    Cookies.remove('token');  // Clear the token cookie
    window.location.href = '/';  // Redirect to login page
  }, []);

  return null;
}

export default Logout;
