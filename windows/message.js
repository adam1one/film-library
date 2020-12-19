/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
              Message Popup
------------------------------------------

Shows on top of main window, and question/prompt popups
*/

class MessagePopup {

    constructor() {

        var self = this;

        this.blessed = require('blessed');
        this.callback = function(){};

        this.contentContainer = this.blessed.form({
            left:"center",
            top: "center",
            width: 64,
            height: 9,
            border: {
                type: 'line'   
            },
            padding: {
                left: 5,
                right: 5,
                top: 1,
            },
            style: {
                fg: 'light-white',
                bg: 'black',
                border: {
                    fg: 'green'
                }
            },
            tags: true,
            hidden: true
        });

        this.buttonOk = this.blessed.button({
            parent: this.contentContainer,
            left: 18,
            width: 18,
            height: 3,
            top: 3,
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
            }
        });

        this.buttonOk.key(['return', 'escape'], function(ch, key){
            self.hide();
        });
    }

    show(messageText, buttonText, callback) {
        this.callback = callback;
        this.contentContainer.content = messageText;
        this.buttonOk.content = buttonText ? buttonText : 'Ok';
        this.contentContainer.show();
        this.buttonOk.focus();
        this.contentContainer.screen.render()
    }

    hide() {
        this.contentContainer.hide();
        this.contentContainer.screen.render();
        this.callback();
    }
}
module.exports = MessagePopup;