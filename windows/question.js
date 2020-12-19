/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
             Question Popup
------------------------------------------

Choice of two options
Shows on top of main window, under message popup
*/
class QuestionPopup {

    constructor() {
        
        var self = this;

        this.blessed = require('blessed');
        this.callback = function(){};

        this.contentContainer = this.blessed.form({
            left:"center",
            top: "center",
            width: 70,
            height: 10,
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

        this.buttonNo = this.blessed.button({
            parent: this.contentContainer,
            left: 8,
            width: 20,
            height: 3,
            top: 4,
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

        this.buttonYes = this.blessed.button({
            parent: this.contentContainer,
            left: 30,
            width: 20,
            height: 3,
            top: 4,
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

        this.buttonNo.key(['return', 'escape'], function(ch, key){
            self.hide(false);
        });
        
        this.buttonYes.key(['return', 'escape'], function(ch, key){
            
            if (key.name == 'escape') self.hide(false);
            else self.hide(true);
        });
    }

    show(questionText, yesText, noText, focusNo, callback) {
        this.callback = callback;
        this.contentContainer.content = questionText;        
        this.buttonNo.content = noText ? noText : 'No' ;
        this.buttonYes.content = yesText ? yesText : 'Yes' ;
        this.contentContainer.show();

        if (focusNo) this.buttonNo.focus();
        else this.buttonYes.focus();

        this.contentContainer.screen.render()
    }

    hide(answer) {
        this.contentContainer.hide();
        this.contentContainer.screen.render();
        this.callback(answer);
    }
}
module.exports = QuestionPopup;