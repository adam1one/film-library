/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             App Entry Point
------------------------------------------

Structure
---------
/elements:  Controllers for elements of the app
/functions: Classes used by multiple elements
/windows: Terminal user interface screens
/config: Configuration files

Usage
-----
node run.js
*/

if (parseFloat(process.version.match(/^v(\d+\.\d+)/)[1]) < 14.4) {
    console.log('This app requires Node.js version 14.4 or higher.');
    return process.exit(0);
}

const coreModule = require('./elements');
const app = new coreModule();

app.welcomeScreen();