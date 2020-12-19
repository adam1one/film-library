/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
          Configuration Window
------------------------------------------

Library path, api keys
*/
class LibraryWindow {

    constructor() {

        var self = this;
        this.blessed = require('blessed');

        this.contentContainer = this.blessed.box({
            left:0,
            right: 0,
            top: 0,
            bottom: 0,
            hidden: true
        });

        this.inputContainer = this.blessed.box({
            parent: this.contentContainer,
            top: 1,
            bottom: 4,
            width: 70,
            left: "center"
        });

    
        this.heading = this.blessed.text({
            parent: this.inputContainer,
            left:"center",
            top: 0,
            height: 1,
            style: {
                bold: true,
                underline: true
            },
            content: "Configuration"
        });  


        this.textPath = this.blessed.box({
            parent: this.inputContainer,
            top: 2,
            left: 0,
            width: 25,
            height: 3,
            valign: "middle",
            content: "Film Library Path:",
            style: {
                bold: true
            }
        });

        this.inputPath = this.blessed.textbox({
            parent: this.inputContainer,
            top: 2,
            left: 25,
            width: 50,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    border: {
                        fg: 'light-green',
                    }
                }
            },
        });

        this.inputPath.on('keypress', function(_, key) {   
            self.keypress(this, key);
        }); 

        this.textTMDBApi = this.blessed.box({
            parent: this.inputContainer,
            top: 6,
            left: 0,
            width: 25,
            height: 3,
            valign: "middle",
            content: "TheMovieDB API Key:",
            style: {
                bold: true
            }
        });

        this.inputTMDBApi = this.blessed.textbox({
            parent: this.inputContainer,
            top: 6,
            left: 25,
            width: 50,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    border: {
                        fg: 'light-green',
                    }
                }
            },
        });
        
        this.inputTMDBApi.on('keypress', function(_, key) {   
            self.keypress(this, key);
        }); 

        this.textOMDBApi = this.blessed.box({
            parent: this.inputContainer,
            top: 10,
            left: 0,
            width: 25,
            height: 3,
            valign: "middle",
            content: "OMDB API Key:",
            style: {
                bold: true
            }
        });

        this.inputOMDBApi = this.blessed.textbox({
            parent: this.inputContainer,
            top: 10,
            left: 25,
            width: 50,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    border: {
                        fg: 'light-green',
                    }
                }
            },
        });
        
        this.inputOMDBApi.on('keypress', function(_, key) {   
            self.keypress(this, key);
        }); 

        this.textUsername = this.blessed.box({
            parent: this.inputContainer,
            top: 14,
            left: 0,
            width: 25,
            height: 3,
            valign: "middle",
            content: "OpenSubtitles Username:",
            style: {
                bold: true
            }
        });

        this.inputUsername = this.blessed.textbox({
            parent: this.inputContainer,
            top: 14,
            left: 25,
            width: 50,
            height: 3,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    border: {
                        fg: 'light-green',
                    }
                }
            },
        });
        
        this.inputUsername.on('keypress', function(_, key) {   
            self.keypress(this, key);
        }); 

        this.textPassword = this.blessed.box({
            parent: this.inputContainer,
            top: 18,
            left: 0,
            width: 25,
            height: 3,
            valign: "middle",
            content: "OpenSubtitles Password:",
            style: {
                bold: true
            }
        });

        this.inputPassword = this.blessed.textbox({
            parent: this.inputContainer,
            top: 18,
            left: 25,
            width: 50,
            height: 3,
            censor: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    border: {
                        fg: 'light-green',
                    }
                }
            },
            hidden: true
        });
        
        this.inputPassword.on('keypress', function(_, key) {   
            self.keypress(this, key);
        }); 

        this.buttonChangePassword = this.blessed.button({
            parent: this.inputContainer,
            content: 'Change Password',
            top: 18,
            left: 25,
            width: 50,
            height: 3,
            align: "center",
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    fg: 'light-green',
                    bold: true,    
                    border: {
                        fg: 'light-green',
                    }
                }
            },
            hidden: true
        });

        this.buttonChangePassword.key(['return'], function(ch, key){
            self.buttonChangePassword.hide();
            self.inputPassword.show();
            self.inputPassword.focus();
        }); 

        this.proceedButtonText = 'Continue';
    }

    before(settings) {

        this.inputPath.setValue(settings.libpath);
        this.inputTMDBApi.setValue(settings.tmdbapi);
        this.inputOMDBApi.setValue(settings.omdbapi);
        this.inputUsername.setValue(settings.osuser);
        
        if (settings.ospass.length) this.buttonChangePassword.show();
        else this.inputPassword.show();
    
        if (!settings.libpath) this.initialFocus = this.inputPath;
    }

    after() {
        
        let response = {
            libpath: this.inputPath.value,
            tmdbapi: this.inputTMDBApi.value,
            omdbapi: this.inputOMDBApi.value,
            osuser: this.inputUsername.value
        }

        if (!this.inputPassword.hidden) response.ospass = this.inputPassword.value;
        return response;
    }

    keypress(input, key) {
        let text = input.value;

        if (key.full == 'backspace') text = text.substring(0, text.length - 1);
        else if (text.length >= 1024) return;
        else if (key.full == 'space') text += ' ';
        else if (key.full.length == 1) text += key.full.toString();
        else if (key.sequence.length == 1 && key.shift  & !key.code) text += key.sequence.toString();
        else return;

        input.setValue(text);
        this.contentContainer.screen.render();
    }
}
module.exports = LibraryWindow;