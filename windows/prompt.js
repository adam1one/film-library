/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
              Prompt Popup
------------------------------------------

Text input, ok and cancel buttons
Shows on top of main window, under message popup
*/
class PromptPopup {

    constructor() {
    
        var self = this;

        this.blessed = require('blessed');
        this.callback = function(){};

        this.contentContainer = this.blessed.form({
            left:"center",
            top: "center",
            width: 70,
            height: 11,
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

        this.promptInput = this.blessed.textbox({
            parent: this.contentContainer,
            top: 2,
            left: 0,
            width: 58,
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

        this.buttonCancel = this.blessed.button({
            parent: this.contentContainer,
            content: 'Cancel',
            left: 8,
            width: 20,
            height: 3,
            top: 5,
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

        this.buttonOk = this.blessed.button({
            parent: this.contentContainer,
            content: 'Ok',
            left: 30,
            width: 20,
            height: 3,
            top: 5,
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

        this.promptInput.on('keypress', function(ch, key) {   
            let text = self.promptInput.value;

            if (key.full == 'backspace') text = text.substring(0, text.length - 1);
            else if (text.length >= 1024) return;
            else if (key.full == 'space') text += ' ';
            else if (key.full.length == 1) text += key.full.toString();
            else if (key.sequence.length == 1 && key.shift  & !key.code) text += key.sequence.toString();
            else return;

            self.promptInput.setValue(text);
            self.contentContainer.screen.render();
        }); 

        this.buttonCancel.key(['return'], function(ch, key){
            self.answer(false);
        });
        
        this.buttonOk.key(['return'], function(ch, key){
            self.answer(true);
        }); 
    }

    show(promptText, inputText, callback) {
        this.callback = callback;
        inputText = inputText ? inputText : '';
        this.promptInput.setValue(inputText);
        this.contentContainer.content = promptText;
        this.contentContainer.show();
        this.promptInput.focus();
        this.contentContainer.screen.render()
    }

    answer(submit) {
        let response = {submit: submit};
        if (submit) response.answer = this.promptInput.value;
        this.callback(response);
    }
}
module.exports = PromptPopup;   