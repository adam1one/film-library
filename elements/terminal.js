/* 
==========================================
       Kodi Film Library Maintainer        
==========================================
            Terminal Interface
------------------------------------------

Three layers:
    - Controller/Interface: (this)
    - Windows: main windows shown on the screen (between title and bottom button-menu)
    - Popups: 3 special sub-windows shown on top of main windows
        - Question: boolean input
        - Prompt: text input
        - Message: no input (can also be shown on top of question/prompt)

Windows Classes:

    Required:
        - this.contentContainer: Initially hidden blessed box containing content to be shown

    Optional:
        - this.before(): Called prior to displaying window
        - this.after(): Called when proceed-button pressed
        - this.initialFocus: Element to be focused when window shown (default: proceed-button)
        - this.proceedButtonText: Replace text of proceed-button (default: 'Proceed')
        - this.activityLog = true: Show activity log in window (cannot be altered)
        - this.listeners: Collection of functions called on window events (ie button push)
            ie. {'eventName': function(){}}
            - 'proceed' is reserved for the proceed-button
*/

class TerminalInterface {

    constructor() {
        var self = this;
        this.blessed = require('blessed');

        this.modulesRequired = {
            question: require('../windows/question'),
            prompt: require('../windows/prompt'),
            message: require('../windows/message'),
            welcome: require('../windows/welcome'),
            config: require('../windows/config'),
            language: require('../windows/language'),
            ignore: require('../windows/ignore'),
            analyse: require('../windows/analyse'),
            review: require('../windows/review'),
            task: require('../windows/task'),
            action: require('../windows/action'),
            finish: require('../windows/finish')
        };

        this.activityLogLines = [];
        this.currentMainWindow = null;
        this.currentContainer = null;
        this.lastFocus = null;
        this.proceedListener = function(){};

        this.screen = this.blessed.screen({
            smartCSR: true,
            title: 'Kodi Film Library Maintainer',
        });

        // Ctrl+c force quit
        this.screen.key(['C-c'], function(ch, key) {
            return process.exit(0);
        });

        // Cycle input focus
        this.screen.key(['left', 'right', 'up', 'down', 'tab'], function(ch, key) {
            
            let elementType = this.screen.focused.type;

            switch (key.name) {
                case 'down':   
                    if (elementType == 'list-table' || elementType == 'list' || elementType == 'log') break; 
                    
                case 'right':
                case 'tab':
                    self.currentContainer.focusNext();
                    break;

                case 'up':   
                    if (elementType == 'list-table' || elementType == 'list' || elementType == 'log') break;

                case 'left':        
                    self.currentContainer.focusPrevious();
                    break;                   
            }
        });

        // Contains everything except popups
        this.parentContainer = this.blessed.form({
            parent: this.screen,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: {
                type: 'line'
            },
            style: {
                fg: 'green',
                border: {
                    fg: 'green'
                }
            },
        });
        
        this.title = {
            line: this.blessed.line({
                parent: this.parentContainer,
                top: 1,
                left: 0,
                right: 0,
                orientation: "horizontal",
                fg: 'green'
            }),
            box: this.blessed.box({
                parent: this.parentContainer,
                top: 0,
                height: 3,
                left: 'center',
                padding: {
                    left: 20,
                    right: 20
                },
                border: {
                    type: 'line'
                },
                style: {
                    border: {
                        fg: 'green'
                    },
                },
            }),
            text: this.blessed.text({
                parent: this.parentContainer,
                top: 1,
                left: 'center',
                style: {
                    fg: 'green',
                    bold: true,
                },
                content: "Kodi Film Library Maintainer",
            })
        };

        this.mainWindowContainer = this.blessed.box({
            parent: this.parentContainer,
            top: 3,
            bottom: 0,
            width: '98%',
            left: "center"
        });

        this.windowModules = {
            welcome: new this.modulesRequired.welcome(),
            config: new this.modulesRequired.config(),
            language: new this.modulesRequired.language(),
            ignore: new this.modulesRequired.ignore(),
            analyse: new this.modulesRequired.analyse(),
            review: new this.modulesRequired.review(),
            task: new this.modulesRequired.task(),
            action: new this.modulesRequired.action(),
            finish: new this.modulesRequired.finish()
        };

        Object.keys(this.windowModules).forEach(function(windowName){
            self.mainWindowContainer.append(self.windowModules[windowName].contentContainer);
        });

        this.activityLog = this.blessed.log({
            parent: this.parentContainer,
            top: 4,
            bottom: 4,
            left: 4,
            right: 4,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                border: {
                    fg: 'white'
                },
                focus: {
                    border: {
                        fg: "light-green"
                    },
                }
            },
            scrollOnInput: true,
            keys: true,
            hidden: true
        });

        this.bottomMenu = this.blessed.box({
            parent: this.parentContainer,
            height: 3,
            bottom: 0,
            left: "center",
            shrink: true,
        });

        this.buttonQuit = this.blessed.button({
            parent: this.bottomMenu,
            left: 0,
            content: 'Quit',
            width: 25,
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
            }
        });

        this.buttonQuit.key('return', function(){  
            if (self.bottomMenu.hidden) return;
            self.question('Are you sure you want to quit?', 'Quit', 'Cancel', true, function(answer){
                if (answer === true) return process.exit(0);
            });
        });    

        this.buttonProceed = this.blessed.button({
            parent: this.bottomMenu,
            left: 28,
            content: 'Proceed',
            width: 25,
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
            }
        });
        
        this.buttonProceed.key('return', function(){  
            if (self.bottomMenu.hidden) return;
            var response = null; 
            if (typeof self.currentMainWindow.after === 'function') response = self.currentMainWindow.after();
            self.proceedListener(response);
        });    

        this.progressBar = this.blessed.progressbar({
            parent: this.parentContainer,
            height: 3,
            width: "50%",
            bottom: 0,
            left: "center",
            orientation: 'horizontal',
            hidden: true,
            border: {
                type: 'line'
            },
            style: {
                bar: {
                    bg: 'green'
                },
                border: {
                    fg: 'green'
                }
            }
        });
        
        this.popupModules = {
            question: new this.modulesRequired.question(),
            prompt: new this.modulesRequired.prompt(),
            message: new this.modulesRequired.message()
        }

        Object.keys(this.popupModules).forEach(function(popupName){
            self.screen.append(self.popupModules[popupName].contentContainer);
        });
    } 

    showMainWindow(windowName, windowData) {
        var self = this;

        Object.keys(this.windowModules).forEach(function(windowNameTemp){
            self.windowModules[windowNameTemp].contentContainer.hide();
        });

        Object.keys(this.popupModules).forEach(function(popupName){
            self.popupModules[popupName].contentContainer.hide();
        });
        
        this.currentContainer = this.parentContainer;
        this.currentMainWindow = this.windowModules[windowName];
        this.currentMainWindow.contentContainer.show();
       
        this.buttonProceed.content = (typeof this.currentMainWindow.proceedButtonText === 'string') ? this.currentMainWindow.proceedButtonText : 'Proceed';

        if (this.currentMainWindow.activityLog === true) this.activityLog.show();
        else this.activityLog.hide();

        if (typeof this.currentMainWindow.before === 'function') this.currentMainWindow.before(windowData);

        if (typeof this.currentMainWindow.initialFocus === 'object') this.currentMainWindow.initialFocus.focus();
        else this.buttonProceed.focus();
                
        this.screen.render();
    }

    // Listen for a window event
    listen(eventName, callback){
        if (!eventName || eventName == 'proceed') this.proceedListener = callback;
        else if (typeof this.currentMainWindow.listeners[eventName] === 'function') this.currentMainWindow.listeners[eventName] = callback;
    }

    // Call a function in current window class
    action(functiontName, callback) {
        if (typeof this.currentMainWindow[functiontName] === 'function') this.currentMainWindow[functiontName](callback);
    }

    message(messageText, buttonText, callback) {
        var self = this;    
        var previousContainer = this.currentContainer;
        var localLastFocus = this.screen.focused; 
        this.currentContainer = this.popupModules.message.contentContainer;
        
        this.popupModules.message.show(messageText, buttonText, function(){  
            self.currentContainer = previousContainer;   
            localLastFocus.focus();
            if (typeof callback === 'function') callback();
        });
    }

    question(questionText, yesText, noText, focusNo, callback) {
        var self = this;   
        this.lastFocus = this.screen.focused;
        this.currentContainer = this.popupModules.question.contentContainer;

        this.popupModules.question.show(questionText, yesText, noText, focusNo, function(answer){    
            self.currentContainer = self.parentContainer;
            self.lastFocus.focus();
            if (typeof callback === 'function') callback(answer);
        });
    }

    prompt(promptText, inputText, callback) {
        var self = this;
        this.lastFocus = this.screen.focused;
        this.currentContainer = this.popupModules.prompt.contentContainer;

        this.popupModules.prompt.show(promptText, inputText, function(response){      
            if (typeof callback === 'function') callback(response);
        });
    }

    promptHide() {
        this.popupModules.prompt.contentContainer.hide();
        this.currentContainer = this.parentContainer;
        this.lastFocus.focus();
    }

    log(text) {
        this.activityLogLines.push(text);
        this.activityLog.add(text);
    }

    // Replaces buttom menu bar (prevents pressing 'proceed' or 'quit' buttons)
    progressBarShow(){
        this.bottomMenu.hide();
        if (this.buttonProceed.focused || this.buttonQuit.focused) this.currentContainer.focusNext();
        this.progressBar.reset();
        this.progressBar.show();
        this.screen.render();
    };

    progressBarHide(){
        this.progressBar.hide();
        this.bottomMenu.show();
        
        if (typeof this.currentMainWindow.initialFocus === 'object') this.currentMainWindow.initialFocus.focus();
        else this.buttonProceed.focus();
        
        this.screen.render();
    };

    progressBarSet(amount){
        if (amount < 0) amount = 0;
        else if (amount > 100) amount = 100;
        else if (amount == this.progressBar.filled) return;

        this.progressBar.setProgress(amount);
        this.screen.render();
    };

    // Special case for final screen
    finishHide() {
        this.bottomMenu.hide();
    }
}
module.exports = TerminalInterface;